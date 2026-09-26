import { Camera, Vector3 } from "three";

/**
 * Coordinate convention (matches three.js SphereGeometry UVs with an equirectangular
 * texture whose left edge is longitude −180° and top edge latitude +90°):
 *   lon   0°  → +X      lon +90° (E) → −Z      lon −90° (W) → +Z      north pole → +Y
 * Seen from outside with north up, east is to the viewer's right.
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new Vector3()): Vector3 {
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  return target.set(-radius * Math.cos(phi) * Math.sin(theta), radius * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta));
}

/** Y-rotation that turns longitude `lon` to face +Z (the camera in the framing frame). */
export function spinToFaceLongitude(lon: number): number {
  const v = latLonToVector3(0, lon);
  return -Math.atan2(v.x, v.z);
}

/** Signed smallest rotation from `from` to `to` (radians), in (−π, π]. */
export function shortestAngleDelta(from: number, to: number): number {
  const twoPi = Math.PI * 2;
  let d = (to - from) % twoPi;
  if (d > Math.PI) d -= twoPi;
  if (d <= -Math.PI) d += twoPi;
  return d;
}

/**
 * Cosine between the surface normal at `point` and the direction to the camera.
 * > 0 means the point is on the hemisphere the (perspective) camera can see — exact for a
 * sphere, unlike checking view-space z.
 */
export function facingCamera(point: Vector3, sphereCenter: Vector3, cameraPosition: Vector3): number {
  const nx = point.x - sphereCenter.x;
  const ny = point.y - sphereCenter.y;
  const nz = point.z - sphereCenter.z;
  const cx = cameraPosition.x - point.x;
  const cy = cameraPosition.y - point.y;
  const cz = cameraPosition.z - point.z;
  const ln = Math.hypot(nx, ny, nz) || 1;
  const lc = Math.hypot(cx, cy, cz) || 1;
  return (nx * cx + ny * cy + nz * cz) / (ln * lc);
}

/** Opacity for a marker near the limb: 0 behind the horizon, eased to 1 just in front of it. */
export function limbOpacity(facing: number, fadeStart = 0.02, fadeEnd = 0.16): number {
  const t = Math.min(1, Math.max(0, (facing - fadeStart) / (fadeEnd - fadeStart)));
  return t * t * (3 - 2 * t);
}

export interface ScreenPoint {
  x: number;
  y: number;
  /** Inside the camera frustum (in front of the camera and within clip space). */
  inFrustum: boolean;
}

const tmp = new Vector3();

/** World position → CSS pixels of a `cssWidth`×`cssHeight` canvas (DPR-independent). */
export function projectToCss(world: Vector3, camera: Camera, cssWidth: number, cssHeight: number): ScreenPoint {
  tmp.copy(world).project(camera);
  return {
    x: ((tmp.x + 1) / 2) * cssWidth,
    y: ((1 - tmp.y) / 2) * cssHeight,
    inFrustum: tmp.z > -1 && tmp.z < 1 && Math.abs(tmp.x) <= 1.05 && Math.abs(tmp.y) <= 1.05,
  };
}
