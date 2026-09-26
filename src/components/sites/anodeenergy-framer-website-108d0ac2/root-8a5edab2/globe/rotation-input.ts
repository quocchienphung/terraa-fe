/**
 * Pure rotation-input logic for the globe (no DOM, no three.js), so it can be unit-tested.
 *
 * Sign convention: positive angular velocity turns the surface so the visible side moves to
 * the viewer's right (eastward rotation, the idle direction). Screen-right pointer = positive.
 */

export interface SteeringConfig {
  /** |x| below this keeps the idle speed. */
  deadZone: number;
  /** Multiplier at the left edge is 1 − leftGain (1 − 7 = −6×). */
  leftGain: number;
  /** Multiplier at the right edge is 1 + rightGain (1 + 5 = +6×). */
  rightGain: number;
}

/**
 * Speed multiplier for a pointer at normalised horizontal position x ∈ [−1, 1].
 * Continuous: 1 inside the dead zone, smoothstep out to 1 − leftGain (left) / 1 + rightGain (right),
 * crossing zero on the left so idle turns into reverse without a jump.
 */
export function steeringMultiplier(x: number, cfg: SteeringConfig): number {
  const cx = Math.max(-1, Math.min(1, x));
  const q = Math.min(1, Math.max(0, (Math.abs(cx) - cfg.deadZone) / (1 - cfg.deadZone)));
  const s = q * q * (3 - 2 * q);
  return cx < 0 ? 1 - cfg.leftGain * s : 1 + cfg.rightGain * s;
}

/** Frame-rate independent exponential approach of `current` to `target` over `dt` seconds. */
export function damp(current: number, target: number, dt: number, tau: number): number {
  if (tau <= 0 || dt <= 0) return dt <= 0 ? current : target;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
}

export interface RotationInputs {
  /** Explicit Pause button. */
  paused: boolean;
  /** Pointer or keyboard focus on a pin/card/control: stop the surface so it can be read. */
  held: boolean;
  reducedMotion: boolean;
  /** Normalised pointer x over the globe, or null when not steering. */
  steerX: number | null;
  /** Seconds of release inertia left (0 when none). */
  inertiaLeft: number;
}

export interface RotationTuning {
  baseOmega: number;
  steering: SteeringConfig;
  tauSteer: number;
  tauIdle: number;
  tauHold: number;
  tauPause: number;
  tauInertia: number;
}

/**
 * Target angular velocity and the time constant used to reach it. One place decides the
 * priority: pause > reduced motion > UI hold > release inertia > steering > idle.
 */
export function rotationTarget(inputs: RotationInputs, t: RotationTuning): { omega: number; tau: number } {
  if (inputs.paused) return { omega: 0, tau: t.tauPause };
  if (inputs.reducedMotion) return { omega: 0, tau: 0 };
  if (inputs.held) return { omega: 0, tau: t.tauHold };
  const steerOmega = inputs.steerX === null ? t.baseOmega : t.baseOmega * steeringMultiplier(inputs.steerX, t.steering);
  if (inputs.inertiaLeft > 0) return { omega: steerOmega, tau: t.tauInertia };
  return { omega: steerOmega, tau: inputs.steerX === null ? t.tauIdle : t.tauSteer };
}

/** Smoothed drag velocity (rad/s) from one pointer sample. */
export function smoothVelocity(previous: number, deltaYaw: number, dt: number, tau: number): number {
  if (dt <= 0) return previous;
  return damp(previous, deltaYaw / dt, dt, tau);
}

/** Velocity handed to inertia on release: zero if the pointer had stopped, clamped otherwise. */
export function releaseVelocity(smoothed: number, msSinceLastMove: number, staleMs: number, maxOmega: number): number {
  if (msSinceLastMove > staleMs) return 0;
  return Math.max(-maxOmega, Math.min(maxOmega, smoothed));
}

/**
 * Yaw change for a horizontal pointer delta in CSS px, given how many CSS px the grabbed surface
 * point moves per radian of spin (≈ the projected globe radius near the centre).
 */
export function dragDeltaYaw(dxCss: number, pxPerRadian: number, gain: number): number {
  return pxPerRadian > 0 ? (dxCss / pxPerRadian) * gain : 0;
}

/**
 * Horizontal pointer position normalised to the visible globe: 0 at the globe's centre line,
 * ±1 at the globe's visible edge (or the canvas edge when the globe is wider than the canvas).
 */
export function normalisedSteerX(pointerX: number, canvasWidth: number, globeRadiusCss: number): number {
  const half = Math.min(globeRadiusCss, canvasWidth / 2);
  if (half <= 0) return 0;
  return Math.max(-1, Math.min(1, (pointerX - canvasWidth / 2) / half));
}

/** U offset of the cloud texture relative to the surface after the cloud shell yawed by `cloudYaw`. */
export function cloudUvOffset(cloudYaw: number): number {
  return cloudYaw / (Math.PI * 2);
}
