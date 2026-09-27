import type { Bounds, CameraPreset, Vec3 } from "./viewerTypes";

export interface FitResult {
  position: Vec3;
  target: Vec3;
  /** Bounding-sphere radius used for every scale-dependent setting (never 0). */
  radius: number;
  near: number;
  far: number;
  minDistance: number;
  maxDistance: number;
}

/** Default three-quarter view direction (from target towards camera). */
export const DEFAULT_VIEW_DIR: Vec3 = [0.72, 0.5, 1];

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);

export function boundsCenter(b: Bounds): Vec3 {
  return [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
}

export function boundsRadius(b: Bounds): number {
  const r = len(sub(b.max, b.min)) / 2;
  return Number.isFinite(r) && r > 1e-6 ? r : 1;
}

export function isValidBounds(b: Bounds | null | undefined): b is Bounds {
  if (!b) return false;
  return [...b.min, ...b.max].every(Number.isFinite) && b.min.every((v, i) => v <= b.max[i]);
}

/** Clip planes and zoom limits scaled to the scene so nothing is clipped at any zoom level. */
export function clipForRadius(radius: number, distance: number) {
  return {
    near: Math.max(radius * 0.002, 1e-4),
    far: Math.max(distance + radius * 8, radius * 12),
    minDistance: radius * 0.05,
    maxDistance: Math.max(distance * 4, radius * 6),
  };
}

/**
 * Distance at which the bounding sphere fits both the vertical and the horizontal field of view.
 * `aspect` = width / height; a narrow (portrait) canvas is limited by the horizontal FOV.
 */
export function fitDistance(radius: number, fovDeg: number, aspect: number, padding = 1.1): number {
  const v = (fovDeg * Math.PI) / 360;
  const h = Math.atan(Math.tan(v) * Math.max(aspect, 1e-3));
  return (radius * padding) / Math.sin(Math.min(v, h));
}

/**
 * Exact perspective fit of the 8 box corners seen from `dir` (target → camera). Tighter than the
 * bounding sphere for boxy scenes viewed diagonally, and never lets a corner leave the frustum.
 */
export function fitBoxDistance(bounds: Bounds, dir: Vec3, fovDeg: number, aspect: number, padding = 1.08): number {
  const c = boundsCenter(bounds);
  const dl = len(dir) || 1;
  const d: Vec3 = [dir[0] / dl, dir[1] / dl, dir[2] / dl];
  // Camera basis: forward = -d, right = forward × worldUp, up = right × forward.
  let right: Vec3 = [-d[2], 0, d[0]];
  const rl = len(right);
  right = rl > 1e-6 ? [right[0] / rl, 0, right[2] / rl] : [1, 0, 0];
  const up: Vec3 = [d[1] * right[2] - d[2] * right[1], d[2] * right[0] - d[0] * right[2], d[0] * right[1] - d[1] * right[0]];
  const tanV = Math.tan((fovDeg * Math.PI) / 360) / padding;
  const tanH = (Math.tan((fovDeg * Math.PI) / 360) * Math.max(aspect, 1e-3)) / padding;
  let need = 0;
  let maxZ = -Infinity;
  for (const x of [bounds.min[0], bounds.max[0]])
    for (const y of [bounds.min[1], bounds.max[1]])
      for (const z of [bounds.min[2], bounds.max[2]]) {
        const v: Vec3 = [x - c[0], y - c[1], z - c[2]];
        const px = v[0] * right[0] + v[1] * right[1] + v[2] * right[2];
        const py = v[0] * up[0] + v[1] * up[1] + v[2] * up[2];
        const pz = v[0] * d[0] + v[1] * d[1] + v[2] * d[2];
        maxZ = Math.max(maxZ, pz);
        need = Math.max(need, pz + Math.abs(px) / tanH, pz + Math.abs(py) / tanV);
      }
  return Math.max(need, maxZ + boundsRadius(bounds) * 0.05);
}

export function fitCameraToBounds(
  bounds: Bounds,
  fovDeg: number,
  aspect: number,
  options: { direction?: Vec3; padding?: number } = {},
): FitResult {
  const valid = isValidBounds(bounds);
  const target = valid ? boundsCenter(bounds) : ([0, 0, 0] as Vec3);
  const radius = valid ? boundsRadius(bounds) : 1;
  const dir = options.direction ?? DEFAULT_VIEW_DIR;
  const dl = len(dir) || 1;
  const distance = valid ? fitBoxDistance(bounds, dir, fovDeg, aspect, options.padding) : fitDistance(radius, fovDeg, aspect, options.padding);
  const position: Vec3 = [
    target[0] + (dir[0] / dl) * distance,
    target[1] + (dir[1] / dl) * distance,
    target[2] + (dir[2] / dl) * distance,
  ];
  return { position, target, radius, ...clipForRadius(radius, distance) };
}

/** Canvas aspect the manifest presets are authored at (desktop Viewroom canvas ≈ 1376×628). */
export const PRESET_DESIGN_ASPECT = 2.2;

/**
 * Home view: a manifest preset when present (authored for that asset), otherwise an automatic fit.
 * On canvases narrower than the one the preset was authored for, the camera is pulled back along
 * the preset's own direction by the exact box-fit ratio, so the framing never crops sideways.
 */
export function homeView(bounds: Bounds, fovDeg: number, aspect: number, preset?: CameraPreset, designAspect = PRESET_DESIGN_ASPECT): FitResult {
  if (!preset) return fitCameraToBounds(bounds, fovDeg, aspect);
  const valid = isValidBounds(bounds);
  const radius = valid ? boundsRadius(bounds) : 1;
  const offset = sub(preset.position, preset.target);
  const base = len(offset) || radius;
  const scale = valid
    ? fitBoxDistance(bounds, offset, fovDeg, aspect) / fitBoxDistance(bounds, offset, fovDeg, designAspect)
    : fitDistance(1, fovDeg, aspect) / fitDistance(1, fovDeg, designAspect);
  // Horizontal box extents hug the silhouette more tightly than vertical ones seen from above, so
  // narrow canvases get a little extra margin (continuous: identical to the preset at scale 1).
  const distance = base * Math.pow(Math.max(1, scale), 1.3);
  const k = distance / base;
  const position: Vec3 = [
    preset.target[0] + offset[0] * k,
    preset.target[1] + offset[1] * k,
    preset.target[2] + offset[2] * k,
  ];
  return { position, target: [...preset.target], radius, ...clipForRadius(radius, distance) };
}

/**
 * Robust bounds from point samples (Gaussian centres): per-axis percentiles so a few floaters far
 * from the capture do not shrink the subject to a dot. `lo`/`hi` are fractions (0.01 / 0.99);
 * `margin` grows each axis by that fraction of its extent so the trimmed tips stay in frame.
 */
export function percentileBounds(xs: Float32Array, ys: Float32Array, zs: Float32Array, lo = 0.01, hi = 0.99, margin = 0): Bounds | null {
  const n = xs.length;
  if (n === 0) return null;
  const pick = (arr: Float32Array): [number, number] => {
    const s = Float32Array.from(arr).sort();
    const a = s[Math.min(n - 1, Math.max(0, Math.floor(lo * (n - 1))))];
    const b = s[Math.min(n - 1, Math.max(0, Math.ceil(hi * (n - 1))))];
    const pad = (b - a) * margin;
    return [a - pad, b + pad];
  };
  const [x0, x1] = pick(xs);
  const [y0, y1] = pick(ys);
  const [z0, z1] = pick(zs);
  return { min: [x0, y0, z0], max: [x1, y1, z1] };
}
