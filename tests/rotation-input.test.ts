import { test } from "node:test";
import assert from "node:assert/strict";
import { SphereGeometry, Vector3 } from "three";
import {
  cloudUvOffset,
  releaseSpeed,
  rotationTarget,
  type RotationInputs,
  type RotationTuning,
} from "../src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/rotation-input.ts";

const base = (Math.PI * 2) / 150;
const TUNING: RotationTuning = { baseOmega: base, tauIdle: 0.45, tauHold: 0.08, tauPause: 0.12, tauInertia: 0.25 };
const idle: RotationInputs = { paused: false, held: false, grabbed: false, reducedMotion: false, inertiaLeft: 0 };
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("priority: pause > reduced motion > grab / UI hold > inertia > idle", () => {
  assert.deepEqual(rotationTarget({ ...idle, paused: true, grabbed: true, inertiaLeft: 0.5 }, TUNING), { speed: 0, tau: 0.12 });
  assert.deepEqual(rotationTarget({ ...idle, reducedMotion: true, inertiaLeft: 0.5 }, TUNING), { speed: 0, tau: 0 });
  assert.deepEqual(rotationTarget({ ...idle, grabbed: true, inertiaLeft: 0.5 }, TUNING), { speed: 0, tau: 0.08 });
  assert.deepEqual(rotationTarget({ ...idle, held: true }, TUNING), { speed: 0, tau: 0.08 });
  assert.deepEqual(rotationTarget({ ...idle, inertiaLeft: 0.3 }, TUNING), { speed: base, tau: 0.25 });
  assert.deepEqual(rotationTarget(idle, TUNING), { speed: base, tau: 0.45 });
});

test("release: a fresh fling is kept, a fast one clamped", () => {
  const fresh = { speed: 0.8, msSinceLastMove: 16, paused: false, reducedMotion: false };
  close(releaseSpeed(fresh, 90, 3), 0.8);
  assert.equal(releaseSpeed({ ...fresh, speed: 9 }, 90, 3), 3);
});

test("release: a pointer that stopped before letting go does not fling from its old velocity", () => {
  assert.equal(releaseSpeed({ speed: 2.5, msSinceLastMove: 200, paused: false, reducedMotion: false }, 90, 3), 0);
});

test("release: Pause and reduced motion never produce inertia", () => {
  assert.equal(releaseSpeed({ speed: 2.5, msSinceLastMove: 10, paused: true, reducedMotion: false }, 90, 3), 0);
  assert.equal(releaseSpeed({ speed: 2.5, msSinceLastMove: 10, paused: false, reducedMotion: true }, 90, 3), 0);
  assert.equal(releaseSpeed({ speed: Number.NaN, msSinceLastMove: 10, paused: false, reducedMotion: false }, 90, 3), 0);
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
