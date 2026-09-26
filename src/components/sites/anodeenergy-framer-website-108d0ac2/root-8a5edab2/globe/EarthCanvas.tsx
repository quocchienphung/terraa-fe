"use client";

import { useEffect, useRef } from "react";
import { Euler, Matrix4, Quaternion, Ray, Sphere, Vector3 } from "three";
import type { GeoPoint } from "@/types/anode";
import { CAMERA_FOV_DEG, CLOUDS, ENTRY, INTERACTION, ORIENTATION, pickFraming, pickTier } from "./earth-config";
import { createEarthScene, type EarthScene } from "./create-earth-scene";
import { facingCamera, latLonToVector3, limbOpacity, projectToCss, shortestAngleDelta, spinToFaceLongitude } from "./project-markers";
import { damp, dragDeltaYaw, normalisedSteerX, releaseVelocity, rotationTarget, smoothVelocity, type RotationTuning } from "./rotation-input";

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
  /** Explicit Pause button: surface and clouds stop; hover never restarts it. */
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
const X_AXIS = new Vector3(1, 0, 0);
const Y_AXIS = new Vector3(0, 1, 0);
const ORIGIN = new Vector3();
const TWO_PI = Math.PI * 2;

const TUNING: RotationTuning = {
  baseOmega: TWO_PI / ORIENTATION.periodSeconds,
  steering: INTERACTION.steering,
  tauSteer: INTERACTION.tauSteer,
  tauIdle: INTERACTION.tauIdle,
  tauHold: INTERACTION.tauHold,
  tauPause: INTERACTION.tauPause,
  tauInertia: INTERACTION.tauInertia,
};
const CLOUD_OMEGA = TWO_PI / CLOUDS.relativePeriodSeconds;

function orientationQuaternion(tilt: number, spin: number, target = new Quaternion()): Quaternion {
  const qy = new Quaternion().setFromAxisAngle(Y_AXIS, spin);
  return target.setFromAxisAngle(X_AXIS, tilt).multiply(qy);
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type DragState =
  | { kind: "none" }
  | { kind: "pending"; pointerId: number; startX: number; startY: number; lastX: number; lastT: number; pxPerRadian: number }
  | { kind: "drag"; pointerId: number; lastX: number; lastT: number; velocity: number; pxPerRadian: number };

/**
 * WebGL Earth. Owns the canvas, the render loop and the globe orientation; the parent owns
 * all DOM (title, pins, card, controls) and receives projected pin positions every rendered
 * frame through `onProject` (no React state per frame).
 *
 * Orientation has one writer — the frame loop. Pointer events only record input (steering
 * position, drag deltas); the loop turns them into yaw. Priority per frame:
 * focus tween > drag > (pause | reduced motion | UI hold | inertia | steering | idle).
 */
export function EarthCanvas(props: EarthCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    propsRef.current = props;
    wakeRef.current();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.parentElement;
    if (!canvas || !section) return;

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
    let width = 0;
    let height = 0;
    let rPx = 0;
    let topPx = 0;

    // Orientation state (written only in `frame`).
    let spin = spinToFaceLongitude(ORIENTATION.initialLon);
    const defaultTilt = ORIENTATION.axisLat * DEG;
    let tilt = defaultTilt;
    /** The focus tilt is kept until the focused pin rotates behind the limb. */
    let holdTilt = false;
    let focusedPin = -1;
    let focusedPinVisible = false;
    /** Signed surface angular velocity (rad/s). Starts at idle so the first frames already turn. */
    let omega = propsRef.current.paused || propsRef.current.reducedMotion ? 0 : TUNING.baseOmega;
    let inertiaLeft = 0;
    /** Cloud shell yaw relative to the surface: its own clock. */
    let cloudYaw = 0;
    let entry = propsRef.current.reducedMotion ? 1 : 0;
    let lastFocusSeq = propsRef.current.focus?.seq ?? -1;
    let tween: { from: Quaternion; to: Quaternion; start: number; spin: number; tilt: number } | null = null;

    // Input state (written by events, consumed by `frame`).
    let steerX: number | null = null;
    let drag: DragState = { kind: "none" };
    let pendingYaw = 0;

    const localPins = propsRef.current.markers.map((g) => (g ? latLonToVector3(g.lat, g.lon, 1) : null));
    const world = new Vector3();
    const center = new Vector3();
    const ray = new Ray();
    const sphere = new Sphere();
    const hitNdc = new Vector3();
    const grabPoint = new Vector3();
    const grabLocal = new Vector3();
    const grabInverse = new Matrix4();

    const fitFraming = () => {
      const f = height / 2 / Math.tan((CAMERA_FOV_DEG * DEG) / 2);
      const cfg = pickFraming(width);
      rPx = Math.min((cfg.diameter * width) / 2, cfg.maxRadiusOfHeight * height);
      topPx = cfg.top * height;
      const alpha = Math.atan(rPx / f);
      const distance = 1 / Math.sin(alpha);
      const thetaCenter = Math.atan((height / 2 - topPx) / f) - alpha;
      framing.position.set(0, distance * Math.sin(thetaCenter), -distance * Math.cos(thetaCenter));
      framing.rotation.x = thetaCenter;
    };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h || (w === width && h === height)) return;
      width = w;
      height = h;
      earth.setSize(w, h);
      fitFraming();
      dirty = true;
    };

    /** Cheap ray–sphere test against the globe for a point in canvas CSS px (no scene raycast). */
    const hitsGlobe = (x: number, y: number) => {
      if (!width || !height) return false;
      hitNdc.set((x / width) * 2 - 1, 1 - (y / height) * 2, 0.5).unproject(camera);
      ray.origin.set(0, 0, 0);
      ray.direction.copy(hitNdc).normalize();
      framing.updateMatrixWorld(true);
      sphere.center.setFromMatrixPosition(framing.matrixWorld);
      sphere.radius = framing.scale.x;
      return ray.intersectsSphere(sphere);
    };

    /**
     * Horizontal screen speed (CSS px per radian of spin) of the surface point under (x, y), so a
     * drag keeps the grabbed point under the cursor. Falls back to the projected radius, and is
     * floored so grabbing near the limb (where the surface barely moves sideways) stays controllable.
     */
    const grabPxPerRadian = (x: number, y: number) => {
      const fallback = rPx * framing.scale.x;
      if (!hitsGlobe(x, y) || !ray.intersectSphere(sphere, grabPoint)) return fallback;
      orient.updateMatrixWorld(true);
      grabLocal.copy(grabPoint).applyMatrix4(grabInverse.copy(orient.matrixWorld).invert());
      const a = projectToCss(grabPoint, camera, width, height).x;
      const b = projectToCss(grabLocal.applyAxisAngle(Y_AXIS, 0.01).applyMatrix4(orient.matrixWorld), camera, width, height).x;
      const pxPerRad = (b - a) / 0.01;
      return Math.max(0.35 * fallback, Math.min(2 * fallback, pxPerRad));
    };

    /** Orientation that brings pin `i` to the framing's focus point (refined by projection). */
    const solveFocus = (i: number): { tilt: number; spin: number } | null => {
      const geo = propsRef.current.markers[i];
      const local = localPins[i];
      if (!geo || !local) return null;
      const cfg = pickFraming(width);
      const targetX = cfg.focusX * width;
      const targetY = cfg.focusY * height;
      const centerY = topPx + rPx;
      const elevation = Math.asin(Math.max(-0.95, Math.min(0.95, (centerY - targetY) / rPx)));
      let t = Math.max(-75 * DEG, Math.min(60 * DEG, geo.lat * DEG - elevation));
      let s = spinToFaceLongitude(geo.lon) + Math.asin(Math.max(-0.9, Math.min(0.9, (targetX - width / 2) / (rPx * Math.cos(elevation)))));
      const q = new Quaternion();
      const m = new Matrix4();
      framing.updateMatrixWorld(true);
      for (let k = 0; k < 4; k++) {
        m.makeRotationFromQuaternion(orientationQuaternion(t, s, q)).premultiply(framing.matrixWorld);
        const p = projectToCss(world.copy(local).applyMatrix4(m), camera, width, height);
        s += ((targetX - p.x) / rPx) * 0.9;
        t += ((targetY - p.y) / rPx) * 0.9;
        t = Math.max(-75 * DEG, Math.min(60 * DEG, t));
      }
      return { tilt: t, spin: spin + shortestAngleDelta(spin, s) };
    };

    /** A drag interrupts a focus tween: continue from the orientation currently on screen. */
    const rebaseTween = () => {
      if (!tween) return;
      const e = new Euler().setFromQuaternion(orient.quaternion, "XYZ");
      tilt = e.x;
      spin += shortestAngleDelta(spin, e.y);
      tween = null;
    };

    const project = () => {
      orient.updateMatrixWorld(true);
      center.setFromMatrixPosition(orient.matrixWorld);
      const points = localPins.map((local, i) => {
        if (!local) return null;
        world.copy(local).applyMatrix4(orient.matrixWorld);
        const p = projectToCss(world, camera, width, height);
        const opacity = p.inFrustum ? limbOpacity(facingCamera(world, center, ORIGIN)) : 0;
        if (i === focusedPin) focusedPinVisible = opacity > 0;
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
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed || !ready) return;
      // rAF timestamps can precede the performance.now() taken on wake: clamp to [0, 100ms].
      const dt = Math.min(Math.max(now - last, 0), 100) / 1000;
      last = now;
      const p = propsRef.current;

      // Focus requests from the parent (selection). An explicit selection runs even when paused.
      if (p.focus && p.focus.seq !== lastFocusSeq) {
        lastFocusSeq = p.focus.seq;
        const target = solveFocus(p.focus.index);
        if (target) {
          holdTilt = true;
          focusedPin = p.focus.index;
          if (drag.kind === "drag") drag = { kind: "none" };
          if (p.reducedMotion) {
            spin = target.spin;
            tilt = target.tilt;
            tween = null;
          } else {
            tween = { from: orient.quaternion.clone(), to: orientationQuaternion(target.tilt, target.spin), start: now, ...target };
          }
          dirty = true;
        }
      }

      const dragging = drag.kind === "drag";
      if (tween) {
        const t = Math.min(1, (now - tween.start) / ORIENTATION.focusMs);
        orient.quaternion.slerpQuaternions(tween.from, tween.to, easeInOutCubic(t));
        if (t >= 1) {
          spin = tween.spin;
          tilt = tween.tilt;
          tween = null;
        }
        omega = 0;
        inertiaLeft = 0;
        pendingYaw = 0;
        dirty = true;
      } else {
        if (dragging) {
          // Direct manipulation: the pointer owns yaw; omega mirrors the drag velocity so a
          // release continues smoothly.
          spin += pendingYaw;
          if (pendingYaw !== 0) dirty = true;
          pendingYaw = 0;
          omega = drag.kind === "drag" ? drag.velocity : omega;
        } else {
          inertiaLeft = Math.max(0, inertiaLeft - dt);
          const target = rotationTarget(
            { paused: p.paused, held: p.held, reducedMotion: p.reducedMotion, steerX: p.reducedMotion ? null : steerX, inertiaLeft },
            TUNING,
          );
          omega = damp(omega, target.omega, dt, target.tau);
          if (Math.abs(omega - target.omega) < 1e-5) omega = target.omega;
          spin += omega * dt;
          if (omega !== 0) dirty = true;
        }
        const activity = dragging ? 1 : Math.min(1, Math.abs(omega) / TUNING.baseOmega);
        if (activity > 0 && holdTilt && !focusedPinVisible) holdTilt = false;
        // The tilt only drifts back while the globe turns, so a pause freezes it completely.
        if (!holdTilt && activity > 0 && Math.abs(tilt - defaultTilt) > 1e-4) {
          tilt += (defaultTilt - tilt) * (1 - Math.exp(-(dt * activity) / ORIENTATION.tiltReturnTau));
          dirty = true;
        }
        orientationQuaternion(tilt, spin, orient.quaternion);
      }

      // Weather clock: independent of the surface (held, reversed or dragged), stopped by Pause.
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
      }
      if (dirty) {
        applyEntry();
        earth.render();
        project();
        dirty = false;
      }
      const busy = tween !== null || dragging || omega !== 0 || cloudsDrift || rotationTarget(
        { paused: p.paused, held: p.held, reducedMotion: p.reducedMotion, steerX, inertiaLeft },
        TUNING,
      ).omega !== 0;
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

    // ---- Pointer input -------------------------------------------------------------------
    const setCursor = (c: string) => {
      if (canvas.style.cursor !== c) canvas.style.cursor = c;
    };

    const endDrag = (releaseAt: number | null) => {
      if (drag.kind === "drag") {
        if (canvas.hasPointerCapture(drag.pointerId)) canvas.releasePointerCapture(drag.pointerId);
        const p = propsRef.current;
        const v = releaseAt === null ? 0 : releaseVelocity(drag.velocity, releaseAt - drag.lastT, INTERACTION.releaseStaleMs, INTERACTION.maxFlingOmega);
        // Pause and reduced motion: a drag is a direct edit only — no inertia, no resume.
        omega = p.paused || p.reducedMotion ? 0 : v;
        inertiaLeft = p.paused || p.reducedMotion ? 0 : INTERACTION.inertiaSeconds;
      }
      drag = { kind: "none" };
      setCursor("");
      wake();
    };

    const clearInput = () => {
      steerX = null;
      if (drag.kind !== "none") endDrag(null);
      setCursor("");
    };

    const updateSteer = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !ready) {
        steerX = null;
        return;
      }
      const over = hitsGlobe(e.offsetX, e.offsetY);
      steerX = over ? normalisedSteerX(e.offsetX, width, rPx * framing.scale.x) : null;
      setCursor(over ? "grab" : "");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (drag.kind === "pending" && e.pointerId === drag.pointerId) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.hypot(dx, dy) >= INTERACTION.dragThresholdPx) {
          // Touch: only horizontal gestures rotate; vertical ones stay page scroll (touch-action: pan-y).
          if (e.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) {
            drag = { kind: "none" };
            return;
          }
          rebaseTween();
          canvas.setPointerCapture(e.pointerId);
          drag = { kind: "drag", pointerId: e.pointerId, lastX: drag.lastX, lastT: drag.lastT, velocity: 0, pxPerRadian: drag.pxPerRadian };
          setCursor("grabbing");
        } else {
          return;
        }
      }
      if (drag.kind === "drag") {
        if (e.pointerId !== drag.pointerId) return;
        const now = e.timeStamp;
        const dYaw = dragDeltaYaw(e.clientX - drag.lastX, drag.pxPerRadian, INTERACTION.dragGain);
        pendingYaw += dYaw;
        drag.velocity = smoothVelocity(drag.velocity, dYaw, Math.max(0.001, (now - drag.lastT) / 1000), INTERACTION.velocityTau);
        drag.lastX = e.clientX;
        drag.lastT = now;
        wake();
        return;
      }
      if (e.buttons === 0) {
        updateSteer(e);
        wake();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!ready || !e.isPrimary || e.button !== 0 || drag.kind !== "none") return;
      if (!hitsGlobe(e.offsetX, e.offsetY)) return;
      const pxPerRadian = grabPxPerRadian(e.offsetX, e.offsetY);
      drag = { kind: "pending", pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: e.timeStamp, pxPerRadian };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (drag.kind === "none" || e.pointerId !== drag.pointerId) return;
      if (drag.kind === "pending") {
        drag = { kind: "none" };
        return;
      }
      endDrag(e.timeStamp);
      updateSteer(e);
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (drag.kind !== "none" && e.pointerId === drag.pointerId) endDrag(null);
    };

    const onPointerLeave = (e: PointerEvent) => {
      if (drag.kind === "drag" && e.pointerId === drag.pointerId) return; // captured: keeps dragging
      if (drag.kind === "pending") drag = { kind: "none" };
      steerX = null;
      setCursor("");
      wake();
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("lostpointercapture", onPointerCancel);
    canvas.addEventListener("pointerleave", onPointerLeave);
    const onBlur = () => {
      clearInput();
      wake();
    };
    window.addEventListener("blur", onBlur);

    // ---- Lifecycle ---------------------------------------------------------------------------
    const sleep = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      // Stale input must not survive a hidden tab or an offscreen section.
      clearInput();
      inertiaLeft = 0;
      const p = propsRef.current;
      omega = p.paused || p.reducedMotion || p.held ? 0 : TUNING.baseOmega;
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
      clearInput();
      if (!disposed) propsRef.current.onError("context-lost");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    resize();
    orientationQuaternion(tilt, spin, orient.quaternion);
    earth.ready.then(
      () => {
        if (disposed) return;
        ready = true;
        entry = readEntry();
        applyEntry();
        earth.render();
        project();
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
      if (drag.kind === "drag" && canvas.hasPointerCapture(drag.pointerId)) canvas.releasePointerCapture(drag.pointerId);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("lostpointercapture", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      earth.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={props.className} />;
}
