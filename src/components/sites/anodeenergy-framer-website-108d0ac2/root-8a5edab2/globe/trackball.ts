import { Camera, Object3D, Quaternion, Vector3 } from "three";

/**
 * Virtual trackball for the globe: pure three.js math (no DOM), unit-tested in tests/trackball.test.ts.
 *
 * Model — a ball rolled by the pointer. Each pointer step rotates the globe about an axis lying in
 * the screen plane (seen from the sphere centre), roughly perpendicular to the step: a horizontal
 * drag turns it left/right, a vertical drag tips it over the poles, a diagonal does both and a
 * curved drag changes the axis continuously. While the pointer is on the globe the step carries
 * the grabbed surface point exactly under the pointer; near the limb (where the surface barely
 * moves on screen) and beyond it, the step rolls the ball at a bounded rate instead. Unlike a
 * point-to-point arcball, a straight drag never twists the globe about the view axis — which
 * matters because this framing mostly shows the upper cap, where an arcball would mostly twist.
 *
 * Spaces: the camera is never moved, so world = camera space. Step rotations are built in world
 * space and conjugated into the framing group's frame, where `orient` (the globe) lives. All
 * screen quantities are CSS pixels of the canvas; device pixel ratio never enters.
 */

const DEG = Math.PI / 180;
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);
/** Probe angle (rad) used to measure how fast the grabbed point moves on screen. */
const PROBE = 1e-3;
const SILHOUETTE_SAMPLES = 96;

/** e^(−dt/τ): the fraction of a difference left after `dt` seconds (0 when τ ≤ 0, i.e. instant). */
export function decayFactor(dt: number, tau: number): number {
  if (dt <= 0) return 1;
  return tau > 0 ? Math.exp(-dt / tau) : 0;
}

/** ∫₀^dt e^(−s/τ) ds = τ(1 − e^(−dt/τ)): exact distance covered by a decaying difference. */
export function decayIntegral(dt: number, tau: number): number {
  if (dt <= 0 || tau <= 0) return 0;
  return tau * (1 - Math.exp(-dt / tau));
}

export interface FramingPose {
  /** Projected globe radius and silhouette top, CSS px (before the scroll-entry scale). */
  radiusPx: number;
  topPx: number;
  /** Camera → globe-centre distance for a unit sphere, and the pitch of the framing group. */
  distance: number;
  pitch: number;
}

export interface FramingSpec {
  diameter: number;
  maxRadiusOfHeight: number;
  top: number;
}

/** Places a unit sphere so its silhouette is `radiusPx` wide with its top at `topPx`. */
export function framingPose(width: number, height: number, fovDeg: number, spec: FramingSpec): FramingPose {
  const f = height / 2 / Math.tan((fovDeg * DEG) / 2);
  const radiusPx = Math.min((spec.diameter * width) / 2, spec.maxRadiusOfHeight * height);
  const topPx = spec.top * height;
  const alpha = Math.atan(radiusPx / f);
  const distance = 1 / Math.sin(alpha);
  const pitch = Math.atan((height / 2 - topPx) / f) - alpha;
  return { radiusPx, topPx, distance, pitch };
}

export function applyFraming(framing: Object3D, pose: FramingPose): void {
  framing.position.set(0, pose.distance * Math.sin(pose.pitch), -pose.distance * Math.cos(pose.pitch));
  framing.rotation.set(pose.pitch, 0, 0);
}

/** North-up orientation: tilt about X after a spin about the globe's own axis. */
export function orientationQuaternion(tilt: number, spin: number, target = new Quaternion()): Quaternion {
  const qy = _q.setFromAxisAngle(Y_AXIS, spin);
  return target.setFromAxisAngle(X_AXIS, tilt).multiply(qy);
}

/** The sphere as the pointer sees it: camera (incl. view offset), canvas CSS size, world centre and radius. */
export interface SphereOnScreen {
  camera: Camera;
  width: number;
  height: number;
  center: Vector3;
  radius: number;
}

const _origin = new Vector3();
const _dir = new Vector3();
const _closest = new Vector3();
const _n = new Vector3();
const _toCam = new Vector3();
const _right = new Vector3();
const _up = new Vector3();
const _t = new Vector3();
const _p0 = new Vector3();
const _p1 = new Vector3();
const _c = new Vector3();
const _u = new Vector3();
const _w = new Vector3();
const _v = new Vector3();
const _n1 = new Vector3();
const _d = new Vector3();
const _a0 = new Vector3();
const _a1 = new Vector3();
const _q = new Quaternion();
const _qStep = new Quaternion();

/** Ray from the camera through CSS pixel (x, y) of the canvas. */
export function pointerRay(camera: Camera, width: number, height: number, x: number, y: number, origin: Vector3, dir: Vector3): void {
  origin.setFromMatrixPosition(camera.matrixWorld);
  dir.set((x / width) * 2 - 1, 1 - (y / height) * 2, 0.5).unproject(camera).sub(origin).normalize();
}

/**
 * Unit normal (from the centre) of the surface point under (x, y). Off the silhouette it is the
 * sphere point nearest the ray, which coincides with the hit point at the limb — so the mapping is
 * continuous and finite however far a captured pointer travels. Returns whether the ray hits.
 */
export function surfaceNormalAt(s: SphereOnScreen, x: number, y: number, target: Vector3): boolean {
  pointerRay(s.camera, s.width, s.height, x, y, _origin, _dir);
  const along = _c.copy(s.center).sub(_origin).dot(_dir);
  _closest.copy(_dir).multiplyScalar(along).add(_origin);
  const d2 = _closest.distanceToSquared(s.center);
  const r2 = s.radius * s.radius;
  if (along > 0 && d2 <= r2) {
    const t = along - Math.sqrt(r2 - d2);
    target.copy(_dir).multiplyScalar(t).add(_origin).sub(s.center).normalize();
    return true;
  }
  target.copy(_closest).sub(s.center);
  if (target.lengthSq() < 1e-18) target.copy(_origin).sub(s.center);
  target.normalize();
  return false;
}

/** Projected radius of the sphere in CSS px (angular radius at the principal point). */
export function projectedRadiusPx(s: SphereOnScreen): number {
  const dist = _origin.setFromMatrixPosition(s.camera.matrixWorld).distanceTo(s.center);
  const focalPx = (s.camera.projectionMatrix.elements[5] * s.height) / 2;
  return (focalPx * s.radius) / Math.sqrt(Math.max(dist * dist - s.radius * s.radius, 1e-12));
}

function toCss(world: Vector3, s: SphereOnScreen, target: Vector3): Vector3 {
  target.copy(world).project(s.camera);
  return target.set(((target.x + 1) / 2) * s.width, ((1 - target.y) / 2) * s.height, 0);
}

export interface Grip {
  /** Bounds on screen px per radian at the grabbed point, as multiples of the projected radius. */
  min: number;
  max: number;
}

/**
 * World-space rotation for one pointer step (x0, y0) → (x1, y1) in canvas CSS px. Writes the unit
 * axis into `axis` and returns the angle in radians (0 when the pointer did not move).
 */
export function rollRotation(s: SphereOnScreen, x0: number, y0: number, x1: number, y1: number, grip: Grip, axis: Vector3): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (!(len > 1e-6)) return 0;

  _toCam.setFromMatrixPosition(s.camera.matrixWorld).sub(s.center).normalize();
  const rPx = projectedRadiusPx(s);
  const maxAngle = len / (grip.min * rPx);

  // On the globe: the rotation about an in-screen-plane axis that carries the surface point under
  // (x0, y0) to the one under (x1, y1). The axis is ⊥ toCam and equidistant from both points.
  if (surfaceNormalAt(s, x0, y0, _n) && surfaceNormalAt(s, x1, y1, _n1)) {
    _d.subVectors(_n1, _n);
    axis.crossVectors(_toCam, _d);
    if (axis.lengthSq() > 0.01 * _d.lengthSq()) {
      axis.normalize();
      _a0.copy(_n).addScaledVector(axis, -axis.dot(_n));
      _a1.copy(_n1).addScaledVector(axis, -axis.dot(_n1));
      const angle = Math.atan2(axis.dot(_w.crossVectors(_a0, _a1)), _a0.dot(_a1));
      if (angle > 0 && angle <= maxAngle) return angle;
    }
  }

  // Near the limb or off the globe: roll about the axis ⊥ the step in the screen plane, at the
  // grabbed point's on-screen speed, bounded by the grip.
  _right.setFromMatrixColumn(s.camera.matrixWorld, 0);
  _up.setFromMatrixColumn(s.camera.matrixWorld, 1);
  _t.copy(_right).multiplyScalar(dx).addScaledVector(_up, -dy);
  _t.addScaledVector(_toCam, -_t.dot(_toCam));
  if (_t.lengthSq() < 1e-18) return 0;
  _t.normalize();
  // The surface facing the viewer moves along the step: axis × toCam = t.
  axis.crossVectors(_toCam, _t).normalize();

  // How many px the grabbed point moves along the step per radian about that axis.
  surfaceNormalAt(s, x0, y0, _n);
  toCss(_v.copy(_n).multiplyScalar(s.radius).add(s.center), s, _p0);
  _n.applyQuaternion(_qStep.setFromAxisAngle(axis, PROBE));
  toCss(_v.copy(_n).multiplyScalar(s.radius).add(s.center), s, _p1);
  const along = ((_p1.x - _p0.x) * dx + (_p1.y - _p0.y) * dy) / (len * PROBE);
  const pxPerRadian = Math.min(grip.max * rPx, Math.max(grip.min * rPx, Number.isFinite(along) ? along : 0));
  return pxPerRadian > 0 ? len / pxPerRadian : 0;
}

/** Re-expresses a world-space direction in `parent`'s frame (rotation only; framing scale is uniform). */
export function worldToLocalDirection(parent: Object3D, dir: Vector3, target: Vector3): Vector3 {
  parent.getWorldQuaternion(_q).invert();
  return target.copy(dir).applyQuaternion(_q);
}

export interface ScreenEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Projected silhouette of the sphere in CSS px. A sphere seen off-axis projects to an ellipse; this
 * framing keeps the centre in the camera's vertical plane, so its axes are screen-aligned and the
 * bounding box of the projected tangent circle defines it. False if the camera is inside the sphere.
 */
export function silhouetteEllipse(s: SphereOnScreen, out: ScreenEllipse): boolean {
  _origin.setFromMatrixPosition(s.camera.matrixWorld);
  _c.copy(s.center).sub(_origin);
  const dist = _c.length();
  if (!(dist > s.radius)) return false;
  _c.divideScalar(dist);
  const ringDistance = (dist * dist - s.radius * s.radius) / dist;
  const ringRadius = (s.radius * Math.sqrt(dist * dist - s.radius * s.radius)) / dist;
  _u.set(Math.abs(_c.x) < 0.9 ? 1 : 0, Math.abs(_c.x) < 0.9 ? 0 : 1, 0);
  _u.addScaledVector(_c, -_u.dot(_c)).normalize();
  _w.crossVectors(_c, _u);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < SILHOUETTE_SAMPLES; i++) {
    const a = (i / SILHOUETTE_SAMPLES) * Math.PI * 2;
    _v.copy(_origin)
      .addScaledVector(_c, ringDistance)
      .addScaledVector(_u, ringRadius * Math.cos(a))
      .addScaledVector(_w, ringRadius * Math.sin(a));
    toCss(_v, s, _p0);
    minX = Math.min(minX, _p0.x);
    maxX = Math.max(maxX, _p0.x);
    minY = Math.min(minY, _p0.y);
    maxY = Math.max(maxY, _p0.y);
  }
  out.cx = (minX + maxX) / 2;
  out.cy = (minY + maxY) / 2;
  out.rx = (maxX - minX) / 2;
  out.ry = (maxY - minY) / 2;
  return Number.isFinite(out.rx) && Number.isFinite(out.ry);
}

/** The globe's own north axis in its parent's frame: the axis idle rotation turns about. */
export function polarAxis(q: Quaternion, target: Vector3): Vector3 {
  return target.copy(Y_AXIS).applyQuaternion(q);
}

/**
 * Advances orientation `q` by angular velocity `omega` (rad/s, axis × speed, parent frame) while
 * `omega` relaxes exponentially towards `target` with time constant `tau` (0 = instantly). The
 * rotation uses the exact integral of that exponential, so speed *and* angle travelled are
 * independent of the frame rate. Mutates `q` and `omega`; returns whether `q` changed.
 */
export function stepSpin(q: Quaternion, omega: Vector3, target: Vector3, dt: number, tau: number): boolean {
  if (dt <= 0) return false;
  const k = decayFactor(dt, tau);
  _v.copy(omega).sub(target);
  _t.copy(target).multiplyScalar(dt).addScaledVector(_v, decayIntegral(dt, tau));
  omega.copy(target).addScaledVector(_v, k);
  if (_v.lengthSq() * k * k < 1e-10) omega.copy(target);
  const angle = _t.length();
  if (!(angle > 0)) return false;
  q.premultiply(_qStep.setFromAxisAngle(_t.divideScalar(angle), angle)).normalize();
  return true;
}

/** Event-rate independent smoothing of the drag's angular velocity from one step (`rotation` = axis × angle). */
export function smoothAngularVelocity(velocity: Vector3, rotation: Vector3, dt: number, tau: number): Vector3 {
  if (dt <= 0) return velocity;
  return velocity.lerp(_v.copy(rotation).divideScalar(dt), 1 - decayFactor(dt, tau));
}
