"use client";

import { useEffect, useRef } from "react";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { GeoPoint } from "@/types/anode";
import { CAMERA_FOV_DEG, CLOUDS, ENTRY, INTERACTION, ORIENTATION, pickFraming, pickTier } from "./earth-config";
import { createEarthScene, type EarthScene } from "./create-earth-scene";
import { facingCamera, latLonToVector3, limbOpacity, projectToCss, spinToFaceLongitude } from "./project-markers";
import { releaseSpeed, rotationTarget, type RotationTuning } from "./rotation-input";
import {
  applyFraming,
  framingPose,
  orientationQuaternion,
  polarAxis,
  rollRotation,
  silhouetteEllipse,
  smoothAngularVelocity,
  stepSpin,
  worldToLocalDirection,
  type FramingPose,
  type ScreenEllipse,
  type SphereOnScreen,
} from "./trackball";

export interface ProjectedMarker {
  x: number;
  y: number;
  /** 0 behind the horizon / outside the frame, eased to 1 in front of the limb. */
  opacity: number;
}

export interface FocusRequest {
  index: number;
  seq: number;
}

interface EarthCanvasProps {
  markers: (GeoPoint | null)[];
  focus: FocusRequest | null;
  /** Explicit Pause button: surface and clouds stop; dragging still works, hover never restarts it. */
  paused: boolean;
  /** Pointer/keyboard focus on a pin, card or control: the surface stops so it can be read. */
  held: boolean;
  reducedMotion: boolean;
  background: string;
  className?: string;
  onProject: (points: (ProjectedMarker | null)[], width: number, height: number) => void;
  onReady: () => void;
  onError: (reason: string) => void;
}

const DEG = Math.PI / 180;
const ORIGIN = new Vector3();
const TWO_PI = Math.PI * 2;
const COARSE_POINTER = "(pointer: coarse)";

const TUNING: RotationTuning = {
  baseOmega: TWO_PI / ORIENTATION.periodSeconds,
  tauIdle: INTERACTION.tauIdle,
  tauHold: INTERACTION.tauHold,
  tauPause: INTERACTION.tauPause,
  tauInertia: INTERACTION.tauInertia,
};
const CLOUD_OMEGA = TWO_PI / CLOUDS.relativePeriodSeconds;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type DragState =
  | { kind: "none" }
  /** Pressed on the globe, not yet past the drag threshold: a tap if released now. */
  | { kind: "pending"; pointerId: number; startX: number; startY: number; lastT: number }
  | { kind: "drag"; pointerId: number; lastX: number; lastY: number; lastT: number };

/**
 * WebGL Earth. Owns the canvas, the drag area, the render loop and the globe orientation; the
 * parent owns all other DOM (title, pins, card, controls) and receives projected pin positions
 * every rendered frame through `onProject` (no React state per frame).
 *
 * Orientation is one quaternion `q` (globe in the framing frame), written only by the frame loop
 * and copied to the scene there. Pointer events record drag rotations into `pending`; the loop
 * applies them. Per frame: pending drag > focus tween > (drag holds still | spin with `omega`).
 *
 * Input goes to a separate drag area shaped like the globe's projected silhouette (`touch-action:
 * none`), not to the canvas, so the browser knows before a touch starts whether it turns the globe
 * or scrolls the page. On touch devices it stops short of the section's side edges (scroll gutters).
 */
export function EarthCanvas(props: EarthCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    propsRef.current = props;
    wakeRef.current();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const hit = hitRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !hit || !section) return;

    let earth: EarthScene;
    try {
      earth = createEarthScene(canvas, pickTier(), propsRef.current.background);
    } catch {
      propsRef.current.onError("webgl-unavailable");
      return;
    }
    const { camera, framing, orient } = earth;

    let disposed = false;
    let ready = false;
    let raf = 0;
    let last = 0;
    let visible = false;
    let dirty = true;
    let hitDirty = true;
    let hitKey = "";
    let width = 0;
    let height = 0;
    let pose: FramingPose = { radiusPx: 0, topPx: 0, distance: 1, pitch: 0 };
    const view: SphereOnScreen = { camera, width: 0, height: 0, center: new Vector3(), radius: 1 };
    const silhouette: ScreenEllipse = { cx: 0, cy: 0, rx: 0, ry: 0 };
    const coarse = window.matchMedia(COARSE_POINTER);

    // Orientation state (applied to the scene only in `frame`).
    const q = orientationQuaternion(ORIENTATION.axisLat * DEG, spinToFaceLongitude(ORIENTATION.initialLon));
    /** Angular velocity (rad/s, axis × speed, framing frame): idle spin, fling inertia or zero. */
    const omega = new Vector3();
    const spinTarget = new Vector3();
    let inertiaLeft = 0;
    let tween: { from: Quaternion; to: Quaternion; start: number } | null = null;
    /** Cloud shell yaw relative to the surface: its own clock. */
    let cloudYaw = 0;
    let entry = propsRef.current.reducedMotion ? 1 : 0;
    let lastFocusSeq = propsRef.current.focus?.seq ?? -1;

    // Input state (written by events, consumed by `frame`).
    let drag: DragState = { kind: "none" };
    const pending = new Quaternion();
    let hasPending = false;
    const dragVelocity = new Vector3();
    const stepAxis = new Vector3();
    const stepRotation = new Vector3();
    const stepQuat = new Quaternion();

    const localPins = propsRef.current.markers.map((g) => (g ? latLonToVector3(g.lat, g.lon, 1) : null));
    const world = new Vector3();
    const center = new Vector3();
    const focusMatrix = new Matrix4();

    const idleOmega = () => {
      const p = propsRef.current;
      if (p.paused || p.reducedMotion || p.held) omega.set(0, 0, 0);
      else polarAxis(q, omega).multiplyScalar(TUNING.baseOmega);
    };
    idleOmega();

    /** Sphere centre/radius as the pointer sees it; call after the framing or entry changes. */
    const syncView = () => {
      framing.updateMatrixWorld(true);
      view.center.setFromMatrixPosition(framing.matrixWorld);
      view.radius = framing.scale.x;
      view.width = width;
      view.height = height;
    };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h || (w === width && h === height)) return;
      width = w;
      height = h;
      earth.setSize(w, h);
      pose = framingPose(w, h, CAMERA_FOV_DEG, pickFraming(w));
      applyFraming(framing, pose);
      syncView();
      dirty = true;
      hitDirty = true;
    };

    /** Fits the drag area to the projected silhouette (minus touch scroll gutters). */
    const layoutHitArea = () => {
      hitDirty = false;
      let key = "none";
      let left = 0;
      let top = 0;
      let right = 0;
      let bottom = 0;
      if (ready && width && height && silhouetteEllipse(view, silhouette)) {
        const g = INTERACTION.touchScrollGutter;
        const gutter = coarse.matches ? clamp(g.fraction * width, g.minPx, g.maxPx) : 0;
        left = Math.max(gutter, silhouette.cx - silhouette.rx);
        right = Math.min(width - gutter, silhouette.cx + silhouette.rx);
        top = Math.max(0, silhouette.cy - silhouette.ry);
        bottom = Math.min(height, silhouette.cy + silhouette.ry);
        if (right - left >= 1 && bottom - top >= 1) {
          key = [left, top, right, bottom, silhouette.cx, silhouette.cy, silhouette.rx, silhouette.ry].map((v) => v.toFixed(1)).join(",");
        }
      }
      if (key === hitKey) return;
      hitKey = key;
      if (key === "none") {
        hit.style.display = "none";
        return;
      }
      const s = hit.style;
      s.display = "block";
      s.left = `${left.toFixed(1)}px`;
      s.top = `${top.toFixed(1)}px`;
      s.width = `${(right - left).toFixed(1)}px`;
      s.height = `${(bottom - top).toFixed(1)}px`;
      s.clipPath = `ellipse(${silhouette.rx.toFixed(1)}px ${silhouette.ry.toFixed(1)}px at ${(silhouette.cx - left).toFixed(1)}px ${(silhouette.cy - top).toFixed(1)}px)`;
    };

    /** North-up orientation that brings pin `i` to the framing's focus point (refined by projection). */
    const solveFocus = (i: number): Quaternion | null => {
      const geo = propsRef.current.markers[i];
      const local = localPins[i];
      if (!geo || !local) return null;
      const cfg = pickFraming(width);
      const targetX = cfg.focusX * width;
      const targetY = cfg.focusY * height;
      const rPx = pose.radiusPx;
      const elevation = Math.asin(clamp((pose.topPx + rPx - targetY) / rPx, -0.95, 0.95));
      let t = clamp(geo.lat * DEG - elevation, -75 * DEG, 60 * DEG);
      let s = spinToFaceLongitude(geo.lon) + Math.asin(clamp((targetX - width / 2) / (rPx * Math.cos(elevation)), -0.9, 0.9));
      const target = new Quaternion();
      framing.updateMatrixWorld(true);
      for (let k = 0; k < 4; k++) {
        focusMatrix.makeRotationFromQuaternion(orientationQuaternion(t, s, target)).premultiply(framing.matrixWorld);
        const p = projectToCss(world.copy(local).applyMatrix4(focusMatrix), camera, width, height);
        s += ((targetX - p.x) / rPx) * 0.9;
        t = clamp(t + ((targetY - p.y) / rPx) * 0.9, -75 * DEG, 60 * DEG);
      }
      return orientationQuaternion(t, s, target);
    };

    const project = () => {
      orient.updateMatrixWorld(true);
      center.setFromMatrixPosition(orient.matrixWorld);
      const points = localPins.map((local) => {
        if (!local) return null;
        world.copy(local).applyMatrix4(orient.matrixWorld);
        const p = projectToCss(world, camera, width, height);
        const opacity = p.inFrustum ? limbOpacity(facingCamera(world, center, ORIGIN)) : 0;
        return { x: p.x, y: p.y, opacity };
      });
      propsRef.current.onProject(points, width, height);
    };

    const readEntry = () => {
      if (propsRef.current.reducedMotion) return 1;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return easeOutCubic(Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.65))));
    };

    /** Scroll entry owns the framing scale and the camera's vertical view offset. */
    const applyEntry = () => {
      framing.scale.setScalar(ENTRY.fromScale + (1 - ENTRY.fromScale) * entry);
      const offset = (1 - entry) * ENTRY.fromOffsetPx;
      if (offset > 0.05) camera.setViewOffset(width, height, 0, -offset, width, height);
      else camera.clearViewOffset();
      syncView();
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !ready) return;
      // rAF timestamps can precede the performance.now() taken on wake: clamp to [0, 100ms].
      const dt = Math.min(Math.max(now - last, 0), 100) / 1000;
      last = now;
      const p = propsRef.current;

      // Drag steps recorded since the last frame (also the tail of a drag released in between).
      if (hasPending) {
        q.premultiply(pending).normalize();
        pending.identity();
        hasPending = false;
        dirty = true;
      }

      // Focus requests from the parent (selection). An explicit selection runs even when paused.
      if (p.focus && p.focus.seq !== lastFocusSeq) {
        lastFocusSeq = p.focus.seq;
        const target = solveFocus(p.focus.index);
        if (target) {
          if (drag.kind !== "none") endDrag(null);
          omega.set(0, 0, 0);
          inertiaLeft = 0;
          if (p.reducedMotion) {
            q.copy(target);
            tween = null;
          } else {
            tween = { from: q.clone(), to: target, start: now };
          }
          dirty = true;
        }
      }

      let target = { speed: 0, tau: 0 };
      if (tween) {
        const t = Math.min(1, (now - tween.start) / ORIENTATION.focusMs);
        q.slerpQuaternions(tween.from, tween.to, easeInOutCubic(t));
        if (t >= 1) tween = null;
        dirty = true;
      } else if (drag.kind !== "drag") {
        inertiaLeft = Math.max(0, inertiaLeft - dt);
        target = rotationTarget(
          { paused: p.paused, held: p.held, grabbed: drag.kind === "pending", reducedMotion: p.reducedMotion, inertiaLeft },
          TUNING,
        );
        polarAxis(q, spinTarget).multiplyScalar(target.speed);
        if (stepSpin(q, omega, spinTarget, dt, target.tau)) dirty = true;
      }
      orient.quaternion.copy(q);

      // Weather clock: independent of the surface (held or dragged), stopped by Pause.
      const cloudsDrift = !p.paused && !p.reducedMotion;
      if (cloudsDrift) {
        cloudYaw = (cloudYaw + CLOUD_OMEGA * dt) % TWO_PI;
        earth.setCloudYaw(cloudYaw);
        dirty = true;
      }

      const nextEntry = readEntry();
      if (Math.abs(nextEntry - entry) > 1e-4) {
        entry = nextEntry;
        dirty = true;
        hitDirty = true;
      }
      if (dirty) {
        applyEntry();
        earth.render();
        project();
        dirty = false;
      }
      if (hitDirty) layoutHitArea();
      const busy = tween !== null || hasPending || cloudsDrift || target.speed !== 0 || omega.lengthSq() > 0;
      // Sleep when nothing moves; props, pointer, scroll, resize and visibility changes wake the loop.
      if (busy) schedule();
    };

    const schedule = () => {
      if (!raf && !disposed && ready && visible && document.visibilityState === "visible") {
        raf = requestAnimationFrame(frame);
      }
    };

    const wake = () => {
      dirty = true;
      if (!raf) last = performance.now();
      schedule();
    };
    wakeRef.current = wake;

    // ---- Pointer input (drag area only) ----------------------------------------------------
    /** Ends the press/drag. `releaseAt` (event time) hands the recent drag velocity to inertia; null drops it. */
    const endDrag = (releaseAt: number | null) => {
      if (drag.kind === "none") return;
      const id = drag.pointerId;
      if (drag.kind === "drag") {
        const p = propsRef.current;
        const speed =
          releaseAt === null
            ? 0
            : releaseSpeed(
                { speed: dragVelocity.length(), msSinceLastMove: releaseAt - drag.lastT, paused: p.paused, reducedMotion: p.reducedMotion },
                INTERACTION.releaseStaleMs,
                INTERACTION.maxFlingOmega,
              );
        if (speed > 0) omega.copy(dragVelocity).setLength(speed);
        else omega.set(0, 0, 0);
        inertiaLeft = speed > 0 ? INTERACTION.inertiaSeconds : 0;
      }
      drag = { kind: "none" };
      dragVelocity.set(0, 0, 0);
      if (hit.hasPointerCapture(id)) hit.releasePointerCapture(id);
      delete hit.dataset.dragging;
      wake();
    };

    /** Records one pointer step (client px) as a rotation for the next frame, and its velocity. */
    const addStep = (x0: number, y0: number, x1: number, y1: number, dtSeconds: number) => {
      const rect = canvas.getBoundingClientRect();
      const angle = rollRotation(view, x0 - rect.left, y0 - rect.top, x1 - rect.left, y1 - rect.top, INTERACTION.grip, stepAxis);
      if (angle > 0) {
        worldToLocalDirection(framing, stepAxis, stepAxis);
        pending.premultiply(stepQuat.setFromAxisAngle(stepAxis, angle));
        hasPending = true;
        stepRotation.copy(stepAxis).multiplyScalar(angle);
      } else {
        stepRotation.set(0, 0, 0);
      }
      smoothAngularVelocity(dragVelocity, stepRotation, dtSeconds, INTERACTION.velocityTau);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!ready || !e.isPrimary || e.button !== 0 || drag.kind !== "none") return;
      hit.setPointerCapture(e.pointerId);
      // Grabbing the globe holds it: stop the spin, a fling and a focus tween where they are.
      tween = null;
      omega.set(0, 0, 0);
      inertiaLeft = 0;
      drag = { kind: "pending", pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, lastT: e.timeStamp };
      hit.dataset.dragging = "true";
      wake();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (drag.kind === "none" || e.pointerId !== drag.pointerId) return;
      if (e.pointerType === "mouse" && (e.buttons & 1) === 0) {
        endDrag(null); // the button was released where we could not see it
        return;
      }
      if (drag.kind === "pending") {
        if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < INTERACTION.dragThresholdPx) return;
        drag = { kind: "drag", pointerId: drag.pointerId, lastX: drag.startX, lastY: drag.startY, lastT: drag.lastT };
      }
      addStep(drag.lastX, drag.lastY, e.clientX, e.clientY, Math.max(0.001, (e.timeStamp - drag.lastT) / 1000));
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.lastT = e.timeStamp;
      wake();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (drag.kind !== "none" && e.pointerId === drag.pointerId) endDrag(e.timeStamp);
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (drag.kind !== "none" && e.pointerId === drag.pointerId) endDrag(null);
    };

    /** A second finger (anywhere) ends the drag without a fling, so a pinch never makes it jump. */
    const onAnyPointerDown = (e: PointerEvent) => {
      if (drag.kind !== "none" && e.pointerId !== drag.pointerId) endDrag(null);
    };

    hit.addEventListener("pointerdown", onPointerDown);
    hit.addEventListener("pointermove", onPointerMove);
    hit.addEventListener("pointerup", onPointerUp);
    hit.addEventListener("pointercancel", onPointerCancel);
    hit.addEventListener("lostpointercapture", onPointerCancel);
    window.addEventListener("pointerdown", onAnyPointerDown, true);
    const onBlur = () => endDrag(null);
    window.addEventListener("blur", onBlur);
    const onPointerKind = () => {
      hitDirty = true;
      wake();
    };
    coarse.addEventListener("change", onPointerKind);

    // ---- Lifecycle ---------------------------------------------------------------------------
    const sleep = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      // Stale input must not survive a hidden tab or an offscreen section.
      endDrag(null);
      inertiaLeft = 0;
      idleOmega();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
      else sleep();
    });
    io.observe(section);

    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });
    ro.observe(canvas);

    const onVisibility = () => {
      if (document.visibilityState === "visible") wake();
      else sleep();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const onScroll = () => {
      if (raf) return;
      last = performance.now();
      schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onContextLost = () => {
      endDrag(null);
      if (!disposed) propsRef.current.onError("context-lost");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    resize();
    orient.quaternion.copy(q);
    earth.ready.then(
      () => {
        if (disposed) return;
        ready = true;
        entry = readEntry();
        applyEntry();
        earth.render();
        project();
        layoutHitArea();
        requestAnimationFrame(() => {
          if (!disposed) propsRef.current.onReady();
        });
        wake();
      },
      (err: unknown) => {
        if (!disposed) propsRef.current.onError(err instanceof Error ? err.message : "texture-load-failed");
      },
    );

    return () => {
      disposed = true;
      wakeRef.current = () => {};
      cancelAnimationFrame(raf);
      if (drag.kind !== "none" && hit.hasPointerCapture(drag.pointerId)) hit.releasePointerCapture(drag.pointerId);
      delete hit.dataset.dragging;
      hit.style.display = "none";
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerdown", onAnyPointerDown, true);
      coarse.removeEventListener("change", onPointerKind);
      hit.removeEventListener("pointerdown", onPointerDown);
      hit.removeEventListener("pointermove", onPointerMove);
      hit.removeEventListener("pointerup", onPointerUp);
      hit.removeEventListener("pointercancel", onPointerCancel);
      hit.removeEventListener("lostpointercapture", onPointerCancel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      earth.dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" className={props.className} />
      {/* Drag area: sized and clipped to the globe's silhouette by the effect; hidden until then. */}
      <div
        ref={hitRef}
        aria-hidden="true"
        data-lenis-prevent-touch=""
        className="absolute left-0 top-0 hidden cursor-grab touch-none select-none data-[dragging=true]:cursor-grabbing"
      />
    </>
  );
}
