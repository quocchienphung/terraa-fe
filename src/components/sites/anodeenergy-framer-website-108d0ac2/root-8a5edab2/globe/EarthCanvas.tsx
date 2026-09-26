"use client";

import { useEffect, useRef } from "react";
import { Matrix4, Quaternion, Vector3 } from "three";
import type { GeoPoint } from "@/types/anode";
import { CAMERA_FOV_DEG, ENTRY, ORIENTATION, pickFraming, pickTier } from "./earth-config";
import { createEarthScene, type EarthScene } from "./create-earth-scene";
import { facingCamera, latLonToVector3, limbOpacity, projectToCss, shortestAngleDelta, spinToFaceLongitude } from "./project-markers";

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
  /** Auto-rotation wanted (not paused by the visitor, not held by hover/focus). */
  spinning: boolean;
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

function orientationQuaternion(tilt: number, spin: number, target = new Quaternion()): Quaternion {
  const qy = new Quaternion().setFromAxisAngle(Y_AXIS, spin);
  return target.setFromAxisAngle(X_AXIS, tilt).multiply(qy);
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * WebGL Earth. Owns the canvas, the render loop and the globe orientation; the parent owns
 * all DOM (title, pins, card, controls) and receives projected pin positions every rendered
 * frame through `onProject` (no React state per frame).
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
    const { camera, framing, orient, clouds } = earth;

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

    // Orientation state (owned here only).
    let spin = spinToFaceLongitude(ORIENTATION.initialLon);
    const defaultTilt = ORIENTATION.axisLat * DEG;
    let tilt = defaultTilt;
    /** The focus tilt is kept until the focused pin rotates behind the limb. */
    let holdTilt = false;
    let focusedPin = -1;
    let focusedPinVisible = false;
    let speed = 0;
    let entry = propsRef.current.reducedMotion ? 1 : 0;
    let lastFocusSeq = propsRef.current.focus?.seq ?? -1;
    let tween: { from: Quaternion; to: Quaternion; start: number; spin: number; tilt: number } | null = null;

    const localPins = propsRef.current.markers.map((g) => (g ? latLonToVector3(g.lat, g.lon, 1) : null));
    const world = new Vector3();
    const center = new Vector3();

    const fitFraming = () => {
      const f = (height / 2) / Math.tan((CAMERA_FOV_DEG * DEG) / 2);
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

      // Focus requests from the parent (selection).
      if (p.focus && p.focus.seq !== lastFocusSeq) {
        lastFocusSeq = p.focus.seq;
        const target = solveFocus(p.focus.index);
        if (target) {
          holdTilt = true;
          focusedPin = p.focus.index;
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

      const wantSpin = p.spinning && !p.reducedMotion && !tween;
      const k = 1 - Math.exp(-dt / ORIENTATION.speedTau);
      const nextSpeed = speed + ((wantSpin ? 1 : 0) - speed) * k;
      speed = Math.abs(nextSpeed - (wantSpin ? 1 : 0)) < 0.001 ? (wantSpin ? 1 : 0) : Math.min(1, Math.max(0, nextSpeed));

      if (tween) {
        const t = Math.min(1, (now - tween.start) / ORIENTATION.focusMs);
        orient.quaternion.slerpQuaternions(tween.from, tween.to, easeInOutCubic(t));
        if (t >= 1) {
          spin = tween.spin;
          tilt = tween.tilt;
          tween = null;
        }
        dirty = true;
      } else {
        if (speed > 0) {
          const omega = (Math.PI * 2) / ORIENTATION.periodSeconds;
          spin += omega * speed * dt;
          clouds.rotation.y += ((Math.PI * 2) / ORIENTATION.cloudPeriodSeconds) * speed * dt;
          if (holdTilt && !focusedPinVisible) holdTilt = false;
          dirty = true;
        }
        // The tilt only drifts back while rotating, so a pause freezes the globe completely.
        if (!holdTilt && speed > 0 && Math.abs(tilt - defaultTilt) > 1e-4) {
          tilt += (defaultTilt - tilt) * (1 - Math.exp(-(dt * speed) / ORIENTATION.tiltReturnTau));
          dirty = true;
        }
        orientationQuaternion(tilt, spin, orient.quaternion);
      }

      const nextEntry = readEntry();
      if (Math.abs(nextEntry - entry) > 1e-4) {
        entry = nextEntry;
        dirty = true;
      }
      const busy = wantSpin || speed > 0 || tween !== null;
      if (dirty) {
        applyEntry();
        earth.render();
        project();
        dirty = false;
      }
      // Sleep when nothing moves; props, scroll, resize and visibility changes wake the loop.
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

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(section);

    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });
    ro.observe(canvas);

    const onVisibility = () => {
      if (document.visibilityState === "visible") wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const onScroll = () => {
      if (raf) return;
      last = performance.now();
      schedule();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onContextLost = () => {
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
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      earth.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={props.className} />;
}
