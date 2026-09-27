import { boundsCenter, boundsRadius, fitDistance, isValidBounds } from "./cameraFit.ts";
import type { Bounds, TourKeyframe, Vec3 } from "./viewerTypes";

/**
 * Cinematic tour sampling. Positions and targets follow uniform Catmull-Rom splines through the
 * keyframes; each segment is eased in/out so the camera settles briefly on every framed view.
 * Pure math — the controller only feeds it elapsed time.
 */

export function tourDuration(frames: TourKeyframe[]): number {
  return frames.slice(1).reduce((s, f) => s + Math.max(0, f.duration), 0);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function spline(points: Vec3[], i: number, t: number): Vec3 {
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(points.length - 1, i + 1)];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  return [0, 1, 2].map((k) => catmull(p0[k], p1[k], p2[k], p3[k], t)) as Vec3;
}

/** Camera pose at `time` seconds (clamped to the tour). */
export function sampleTour(frames: TourKeyframe[], time: number): { position: Vec3; target: Vec3; done: boolean } {
  if (frames.length === 0) return { position: [0, 0, 1], target: [0, 0, 0], done: true };
  if (frames.length === 1) return { position: [...frames[0].position], target: [...frames[0].target], done: true };
  const total = tourDuration(frames);
  let t = Math.min(Math.max(time, 0), total);
  for (let i = 1; i < frames.length; i++) {
    const d = Math.max(frames[i].duration, 1e-6);
    if (t <= d || i === frames.length - 1) {
      const u = easeInOut(Math.min(t / d, 1));
      const positions = frames.map((f) => f.position);
      const targets = frames.map((f) => f.target);
      return { position: spline(positions, i - 1, u), target: spline(targets, i - 1, u), done: time >= total };
    }
    t -= d;
  }
  const last = frames[frames.length - 1];
  return { position: [...last.position], target: [...last.target], done: true };
}

/**
 * Generic tour for assets without an authored one: a slow orbit that stays outside the bounding
 * sphere (so it can never pass through the model), ending on the start view.
 */
export function orbitTourForBounds(bounds: Bounds, fovDeg: number, aspect: number): TourKeyframe[] | null {
  if (!isValidBounds(bounds)) return null;
  const c = boundsCenter(bounds);
  const r = boundsRadius(bounds);
  const d = Math.max(fitDistance(r, fovDeg, aspect), r * 1.4);
  const at = (azDeg: number, elDeg: number, k: number): Vec3 => {
    const az = (azDeg * Math.PI) / 180;
    const el = (elDeg * Math.PI) / 180;
    return [c[0] + Math.sin(az) * Math.cos(el) * d * k, c[1] + Math.sin(el) * d * k, c[2] + Math.cos(az) * Math.cos(el) * d * k];
  };
  return [
    { position: at(35, 26, 1.05), target: c, duration: 0 },
    { position: at(110, 16, 0.95), target: c, duration: 6 },
    { position: at(200, 34, 1.0), target: c, duration: 6 },
    { position: at(290, 12, 0.9), target: c, duration: 6 },
    { position: at(395, 26, 1.05), target: c, duration: 6 },
  ];
}
