import { test } from "node:test";
import assert from "node:assert/strict";
import { orbitTourForBounds, sampleTour, tourDuration } from "../src/lib/viewroom/tour.ts";
import { boundsCenter, boundsRadius } from "../src/lib/viewroom/cameraFit.ts";
import { TOKYO_PROTOTYPE } from "../src/lib/viewroom/viewerManifest.ts";
import type { Bounds, TourKeyframe, Vec3 } from "../src/lib/viewroom/viewerTypes.ts";

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const frames = TOKYO_PROTOTYPE.tour as TourKeyframe[];

test("Tokyo tour is 3–5 keyframes and 20–30 seconds", () => {
  assert.ok(frames.length >= 3 && frames.length <= 5);
  const total = tourDuration(frames);
  assert.ok(total >= 20 && total <= 30, `duration ${total}`);
});

test("the tour passes exactly through each keyframe and reports completion", () => {
  let t = 0;
  frames.forEach((f, i) => {
    if (i > 0) t += f.duration;
    const s = sampleTour(frames, t);
    assert.ok(dist(s.position, f.position) < 1e-6, `keyframe ${i}`);
    assert.ok(dist(s.target, f.target) < 1e-6);
  });
  assert.equal(sampleTour(frames, t - 0.01).done, false);
  assert.equal(sampleTour(frames, t).done, true);
  assert.deepEqual(sampleTour(frames, t + 100).position, sampleTour(frames, t).position);
});

test("camera motion is continuous (no jumps between segments)", () => {
  const total = tourDuration(frames);
  let prev = sampleTour(frames, 0).position;
  let maxStep = 0;
  for (let t = 0.02; t <= total; t += 0.02) {
    const p = sampleTour(frames, t).position;
    maxStep = Math.max(maxStep, dist(p, prev));
    prev = p;
  }
  assert.ok(maxStep < 25, `max step per 20 ms: ${maxStep.toFixed(2)} world units`);
});

test("Tokyo tour never enters the building volume below the roofline", () => {
  // Building shell footprint measured from the FBX (meshes Object674/649/705), roof at y≈223.
  const shell: Bounds = { min: [-358, -273, -302], max: [186, 223, 250] };
  const total = tourDuration(frames);
  for (let t = 0; t <= total; t += 0.05) {
    const [x, y, z] = sampleTour(frames, t).position;
    const inside = x > shell.min[0] && x < shell.max[0] && y > shell.min[1] && y < shell.max[1] && z > shell.min[2] && z < shell.max[2];
    assert.ok(!inside, `camera inside the building at t=${t.toFixed(2)}: ${[x, y, z].map((v) => v.toFixed(0))}`);
  }
});

test("generic orbit tour stays outside the bounding sphere", () => {
  const b: Bounds = { min: [-1, 0, -1], max: [1, 4, 1] };
  const tour = orbitTourForBounds(b, 45, 16 / 9)!;
  const c = boundsCenter(b);
  const r = boundsRadius(b);
  for (let t = 0; t <= tourDuration(tour); t += 0.1) assert.ok(dist(sampleTour(tour, t).position, c) > r);
  assert.equal(orbitTourForBounds({ min: [Number.NaN, 0, 0], max: [1, 1, 1] }, 45, 1), null);
});
