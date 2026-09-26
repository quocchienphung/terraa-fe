import { test } from "node:test";
import assert from "node:assert/strict";
import { SphereGeometry, Vector3 } from "three";
import {
  cloudUvOffset,
  damp,
  dragDeltaYaw,
  normalisedSteerX,
  releaseVelocity,
  rotationTarget,
  smoothVelocity,
  steeringMultiplier,
  type RotationInputs,
  type RotationTuning,
} from "../src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/rotation-input.ts";

const STEER = { deadZone: 0.12, leftGain: 7, rightGain: 5 };
const base = (Math.PI * 2) / 150;
const TUNING: RotationTuning = { baseOmega: base, steering: STEER, tauSteer: 0.24, tauIdle: 0.45, tauHold: 0.08, tauPause: 0.12, tauInertia: 0.25 };
const idle: RotationInputs = { paused: false, held: false, reducedMotion: false, steerX: null, inertiaLeft: 0 };
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("dead zone keeps idle speed", () => {
  for (const x of [-0.12, -0.05, 0, 0.07, 0.12]) close(steeringMultiplier(x, STEER), 1);
});

test("edges cap at −6× (left) and +6× (right); beyond ±1 is clamped", () => {
  close(steeringMultiplier(-1, STEER), -6);
  close(steeringMultiplier(1, STEER), 6);
  close(steeringMultiplier(-3, STEER), -6);
  close(steeringMultiplier(2, STEER), 6);
});

test("left side slows, stops, then reverses — monotonic and continuous", () => {
  let prev = steeringMultiplier(0, STEER);
  let crossed = false;
  for (let i = 1; i <= 1000; i++) {
    const m = steeringMultiplier(-i / 1000, STEER);
    assert.ok(m <= prev + 1e-12, "non-increasing towards the left edge");
    assert.ok(Math.abs(m - prev) < 0.05, `no jump at x=${-i / 1000}`);
    if (prev > 0 && m <= 0) crossed = true;
    prev = m;
  }
  assert.ok(crossed, "passes through zero");
});

test("right side speeds up monotonically and continuously", () => {
  let prev = 1;
  for (let i = 1; i <= 1000; i++) {
    const m = steeringMultiplier(i / 1000, STEER);
    assert.ok(m >= prev - 1e-12);
    assert.ok(Math.abs(m - prev) < 0.05);
    prev = m;
  }
});

test("damping reaches the same value at 60 Hz and 120 Hz (frame-rate independent)", () => {
  const run = (hz: number) => {
    let v = base;
    const target = -6 * base;
    for (let i = 0; i < hz * 0.5; i++) v = damp(v, target, 1 / hz, 0.24);
    return v;
  };
  close(run(60), run(120), 1e-12);
  close(run(144), run(30), 1e-12);
});

test("negative target is reached (reverse rotation) and yaw integrates backwards", () => {
  const target = rotationTarget({ ...idle, steerX: -1 }, TUNING);
  assert.ok(target.omega < 0);
  let omega = base;
  let yaw = 0;
  for (let i = 0; i < 240; i++) {
    omega = damp(omega, target.omega, 1 / 120, target.tau);
    yaw += omega / 120;
  }
  close(omega, -6 * base, 1e-4);
  assert.ok(yaw < 0);
});

test("priority: pause > reduced motion > UI hold > steering; idle otherwise", () => {
  assert.deepEqual(rotationTarget({ ...idle, paused: true, steerX: 1 }, TUNING), { omega: 0, tau: 0.12 });
  assert.deepEqual(rotationTarget({ ...idle, reducedMotion: true, steerX: 1 }, TUNING), { omega: 0, tau: 0 });
  assert.deepEqual(rotationTarget({ ...idle, held: true, steerX: -1 }, TUNING), { omega: 0, tau: 0.08 });
  assert.deepEqual(rotationTarget(idle, TUNING), { omega: base, tau: 0.45 });
  const steer = rotationTarget({ ...idle, steerX: 0.5 }, TUNING);
  assert.equal(steer.tau, 0.24);
  close(steer.omega, base * steeringMultiplier(0.5, STEER));
});

test("inertia decays from the fling velocity back to idle (or the steering target)", () => {
  const t = rotationTarget({ ...idle, inertiaLeft: 0.5 }, TUNING);
  assert.equal(t.tau, 0.25);
  let omega = 2.5;
  let left = 0.7;
  for (let i = 0; i < 120; i++) {
    const tg = rotationTarget({ ...idle, inertiaLeft: left }, TUNING);
    omega = damp(omega, tg.omega, 1 / 60, tg.tau);
    left = Math.max(0, left - 1 / 60);
  }
  assert.ok(Math.abs(omega - base) < 0.01, `settled near idle: ${omega}`);
  assert.ok(omega > 0, "never overshoots below zero");
});

test("release velocity: stale pointer → 0, fast fling clamped", () => {
  assert.equal(releaseVelocity(1.2, 200, 90, 3), 0);
  assert.equal(releaseVelocity(9, 10, 90, 3), 3);
  assert.equal(releaseVelocity(-9, 10, 90, 3), -3);
  close(releaseVelocity(0.8, 16, 90, 3), 0.8);
});

test("drag velocity estimate does not depend on event rate", () => {
  // Constant 1 rad/s drag sampled at 60 and 240 events per second.
  const estimate = (hz: number) => {
    let v = 0;
    for (let i = 0; i < hz * 0.3; i++) v = smoothVelocity(v, 1 / hz, 1 / hz, 0.05);
    return v;
  };
  close(estimate(60), estimate(240), 1e-9);
  assert.ok(Math.abs(estimate(60) - 1) < 0.01);
});

test("drag delta uses CSS px and the projected radius", () => {
  close(dragDeltaYaw(648, 648, 1), 1);
  close(dragDeltaYaw(-324, 648, 1), -0.5);
  assert.equal(dragDeltaYaw(10, 0, 1), 0);
});

test("steering x is normalised to the visible globe", () => {
  close(normalisedSteerX(720, 1440, 648), 0);
  close(normalisedSteerX(720 + 648, 1440, 648), 1);
  close(normalisedSteerX(0, 1440, 648), -1);
  close(normalisedSteerX(390, 390, 740), 1); // globe wider than a phone: canvas edge = ±1
});

test("cloud UV offset matches rotating the cloud shell (checked on SphereGeometry)", () => {
  const geo = new SphereGeometry(1, 64, 32);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  const yaw = (2 * Math.PI) / 8; // 45°, a whole number of segments
  const find = (u: number, v: number) => {
    for (let i = 0; i < uv.count; i++) {
      if (Math.abs(uv.getX(i) - u) < 1e-6 && Math.abs(uv.getY(i) - v) < 1e-6) return new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    throw new Error("vertex not found");
  };
  // A cloud texel at u_c, after the shell yaws by `yaw`, sits over the surface texel u_c + offset,
  // so the surface must sample clouds at u_s − offset.
  const uc = 0.25;
  const v = 0.5;
  const moved = find(uc, v).applyAxisAngle(new Vector3(0, 1, 0), yaw);
  assert.ok(moved.distanceTo(find(uc + cloudUvOffset(yaw), v)) < 1e-6);
});
