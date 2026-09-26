/**
 * Pure rotation-state logic for the globe (no DOM, no three.js), so it can be unit-tested.
 *
 * The globe turns with an angular-velocity vector (see trackball.ts). These helpers decide the
 * idle speed it relaxes towards (about the Earth's own polar axis), how fast, and what a drag
 * release hands to inertia. The pointer never steers the idle rotation: only a press-and-drag
 * moves the globe directly.
 */

export interface RotationInputs {
  /** Explicit Pause button. */
  paused: boolean;
  /** Pointer or keyboard focus on a pin/card/control: stop the surface so it can be read. */
  held: boolean;
  /** The globe is pressed (pointer down, not yet dragging): the hand holds it still. */
  grabbed: boolean;
  reducedMotion: boolean;
  /** Seconds of release inertia left (0 when none). */
  inertiaLeft: number;
}

export interface RotationTuning {
  baseOmega: number;
  tauIdle: number;
  tauHold: number;
  tauPause: number;
  tauInertia: number;
}

/**
 * Target idle speed (rad/s about the polar axis) and the time constant used to reach it. One place
 * decides the priority: pause > reduced motion > grab / UI hold > release inertia > idle.
 */
export function rotationTarget(inputs: RotationInputs, t: RotationTuning): { speed: number; tau: number } {
  if (inputs.paused) return { speed: 0, tau: t.tauPause };
  if (inputs.reducedMotion) return { speed: 0, tau: 0 };
  if (inputs.grabbed || inputs.held) return { speed: 0, tau: t.tauHold };
  if (inputs.inertiaLeft > 0) return { speed: t.baseOmega, tau: t.tauInertia };
  return { speed: t.baseOmega, tau: t.tauIdle };
}

export interface ReleaseInputs {
  /** Magnitude of the smoothed drag angular velocity (rad/s). */
  speed: number;
  /** Time between the last pointer move and the release. */
  msSinceLastMove: number;
  paused: boolean;
  reducedMotion: boolean;
}

/**
 * Speed handed to inertia on release: none under Pause or reduced motion (a drag is a direct edit
 * only), none if the pointer had stopped before letting go, clamped otherwise.
 */
export function releaseSpeed(inputs: ReleaseInputs, staleMs: number, maxSpeed: number): number {
  if (inputs.paused || inputs.reducedMotion || inputs.msSinceLastMove > staleMs) return 0;
  if (!(inputs.speed > 0)) return 0;
  return Math.min(maxSpeed, inputs.speed);
}

/** U offset of the cloud texture relative to the surface after the cloud shell yawed by `cloudYaw`. */
export function cloudUvOffset(cloudYaw: number): number {
  return cloudYaw / (Math.PI * 2);
}
