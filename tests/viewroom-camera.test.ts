import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { fitCameraToBounds, homeView, isValidBounds, percentileBounds } from "../src/lib/viewroom/cameraFit.ts";
import { dprFor, QUALITY_PROFILES, resolveQuality } from "../src/lib/viewroom/quality.ts";
import type { Bounds } from "../src/lib/viewroom/viewerTypes.ts";

/** Tokyo world bounds as measured from the real FBX. */
const TOKYO: Bounds = { min: [-359.11, -272.57, -301.6], max: [402.73, 222.82, 250.64] };

function cornersInFrustum(b: Bounds, fov: number, aspect: number) {
  const fit = fitCameraToBounds(b, fov, aspect);
  const cam = new PerspectiveCamera(fov, aspect, fit.near, fit.far);
  cam.position.set(...fit.position);
  cam.lookAt(new Vector3(...fit.target));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  for (const x of [b.min[0], b.max[0]])
    for (const y of [b.min[1], b.max[1]])
      for (const z of [b.min[2], b.max[2]]) {
        const p = new Vector3(x, y, z).project(cam);
        assert.ok(Math.abs(p.x) <= 1.0001 && Math.abs(p.y) <= 1.0001 && p.z > -1 && p.z < 1, `corner outside frustum at aspect ${aspect}: ${p.toArray()}`);
      }
  return fit;
}

test("fit keeps every bounding-box corner in view for wide, square and portrait canvases", () => {
  for (const aspect of [2.4, 16 / 9, 1, 0.75, 390 / 600]) cornersInFrustum(TOKYO, 45, aspect);
  cornersInFrustum({ min: [-0.1, 0, -0.1], max: [0.1, 3, 0.1] }, 45, 16 / 9); // tall thin (tree trunk)
  cornersInFrustum({ min: [-50, -0.5, -50], max: [50, 0.5, 50] }, 45, 0.6); // flat wide (orchard block)
});

test("narrow canvases pull the camera back instead of cropping", () => {
  const wide = fitCameraToBounds(TOKYO, 45, 16 / 9);
  const narrow = fitCameraToBounds(TOKYO, 45, 0.6);
  const d = (f: typeof wide) => new Vector3(...f.position).distanceTo(new Vector3(...f.target));
  assert.ok(d(narrow) > d(wide) * 1.5);
});

test("clip planes and zoom limits scale with the scene", () => {
  const big = fitCameraToBounds(TOKYO, 45, 1.6);
  const small = fitCameraToBounds({ min: [-0.01, -0.01, -0.01], max: [0.01, 0.01, 0.01] }, 45, 1.6);
  assert.ok(big.near > small.near && big.far > small.far);
  assert.ok(big.near < big.minDistance && big.maxDistance < big.far);
});

test("degenerate or invalid bounds still produce a finite, usable camera", () => {
  for (const b of [
    { min: [1, 1, 1], max: [1, 1, 1] },
    { min: [Number.NaN, 0, 0], max: [1, 1, 1] },
    { min: [2, 0, 0], max: [1, 1, 1] },
  ] as Bounds[]) {
    const fit = fitCameraToBounds(b, 45, 1.5);
    assert.ok([...fit.position, ...fit.target, fit.near, fit.far].every(Number.isFinite), JSON.stringify(b));
    assert.ok(fit.near > 0 && fit.far > fit.near);
  }
  assert.equal(isValidBounds({ min: [2, 0, 0], max: [1, 1, 1] }), false);
});

test("homeView uses the authored preset and only ever pulls back on narrow canvases", () => {
  const preset = { position: [551, 342, 710] as [number, number, number], target: [22, -50, -25] as [number, number, number] };
  const wide = homeView(TOKYO, 45, 2.2, preset);
  assert.deepEqual(wide.position, preset.position);
  const phone = homeView(TOKYO, 45, 0.6, preset);
  const dir = (p: number[]) => new Vector3(p[0] - 22, p[1] + 50, p[2] + 25);
  assert.ok(dir(phone.position).length() > dir(preset.position).length());
  assert.ok(dir(phone.position).normalize().distanceTo(dir(preset.position).normalize()) < 1e-9, "same view direction");
});

test("percentile bounds ignore floaters", () => {
  const n = 1000;
  const xs = new Float32Array(n).map((_, i) => (i / n) * 2 - 1);
  const ys = new Float32Array(n).map(() => 0);
  const zs = new Float32Array(n).map(() => 0);
  xs[0] = -500; // floater
  xs[1] = 800;
  const b = percentileBounds(xs, ys, zs, 0.01, 0.99)!;
  assert.ok(b.min[0] > -1.1 && b.max[0] < 1.1);
  assert.equal(percentileBounds(new Float32Array(0), new Float32Array(0), new Float32Array(0)), null);
});

test("quality profiles: DPR per asset kind and auto selection", () => {
  assert.equal(resolveQuality("auto", { coarsePointer: true }).id, "mobile");
  assert.equal(resolveQuality("auto", { coarsePointer: false }).id, "balanced");
  assert.equal(dprFor("mesh", QUALITY_PROFILES.balanced, 1), 1.5);
  assert.equal(dprFor("mesh", QUALITY_PROFILES.balanced, 3), 2);
  assert.equal(dprFor("gaussian-splat", QUALITY_PROFILES.balanced, 1), 1);
  assert.equal(dprFor("gaussian-splat", QUALITY_PROFILES.mobile, 3), 1.5);
});
