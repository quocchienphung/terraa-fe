import { test } from "node:test";
import assert from "node:assert/strict";
import { Group, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { CAMERA_FOV_DEG, INTERACTION, ORIENTATION, pickFraming } from "../src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/earth-config.ts";
import {
  facingCamera,
  latLonToVector3,
  limbOpacity,
  projectToCss,
  spinToFaceLongitude,
} from "../src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/project-markers.ts";
import {
  applyFraming,
  decayFactor,
  framingPose,
  orientationQuaternion,
  polarAxis,
  projectedRadiusPx,
  rollRotation,
  silhouetteEllipse,
  smoothAngularVelocity,
  stepSpin,
  surfaceNormalAt,
  worldToLocalDirection,
  type ScreenEllipse,
  type SphereOnScreen,
} from "../src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/trackball.ts";

const DEG = Math.PI / 180;
const GRIP = INTERACTION.grip;
const ORIGIN = new Vector3();
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

/** The scene as EarthCanvas builds it: camera at the origin, framing group, globe orientation `q`. */
function makeGlobe(width: number, height: number) {
  const camera = new PerspectiveCamera(CAMERA_FOV_DEG, width / height, 0.1, 200);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const framing = new Group();
  const orient = new Group();
  framing.add(orient);
  const pose = framingPose(width, height, CAMERA_FOV_DEG, pickFraming(width));
  applyFraming(framing, pose);
  framing.updateMatrixWorld(true);
  const view: SphereOnScreen = { camera, width, height, center: new Vector3().setFromMatrixPosition(framing.matrixWorld), radius: 1 };
  const q = orientationQuaternion(ORIENTATION.axisLat * DEG, spinToFaceLongitude(ORIENTATION.initialLon));
  const axis = new Vector3();
  const step = new Quaternion();

  /** Applies a pointer path exactly like the drag handler + frame loop; returns the step angles. */
  const drag = (path: [number, number][]) => {
    const angles: number[] = [];
    for (let i = 1; i < path.length; i++) {
      const angle = rollRotation(view, path[i - 1][0], path[i - 1][1], path[i][0], path[i][1], GRIP, axis);
      angles.push(angle);
      if (angle > 0) q.premultiply(step.setFromAxisAngle(worldToLocalDirection(framing, axis, axis), angle)).normalize();
    }
    return angles;
  };

  /** Surface point (globe-local, unit) currently under CSS pixel (x, y). */
  const grab = (x: number, y: number) => {
    const n = new Vector3();
    assert.ok(surfaceNormalAt(view, x, y, n), `(${x}, ${y}) is on the globe`);
    orient.quaternion.copy(q);
    orient.updateMatrixWorld(true);
    return n.add(view.center).applyMatrix4(new Matrix4().copy(orient.matrixWorld).invert());
  };

  /** Where a globe-local point is on screen now. */
  const screenOf = (local: Vector3) => {
    orient.quaternion.copy(q);
    orient.updateMatrixWorld(true);
    return projectToCss(local.clone().applyMatrix4(orient.matrixWorld), camera, width, height);
  };

  /** The globe's north pole direction in world (= camera) space. */
  const northWorld = () => polarAxis(q, new Vector3()).applyQuaternion(framing.quaternion);

  return { camera, framing, orient, pose, view, q, drag, grab, screenOf, northWorld };
}

const line = (x0: number, y0: number, x1: number, y1: number, steps: number): [number, number][] =>
  Array.from({ length: steps + 1 }, (_, i) => [x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps]);

const assertUnitFinite = (q: Quaternion) => {
  for (const c of [q.x, q.y, q.z, q.w]) assert.ok(Number.isFinite(c), "finite quaternion");
  close(q.length(), 1, 1e-9);
};

test("framing: projected radius and silhouette top match the layout spec", () => {
  for (const [w, h] of [
    [1440, 800],
    [1024, 720],
    [390, 640],
  ]) {
    const g = makeGlobe(w, h);
    close(projectedRadiusPx(g.view), g.pose.radiusPx, 1e-6);
    const e: ScreenEllipse = { cx: 0, cy: 0, rx: 0, ry: 0 };
    assert.ok(silhouetteEllipse(g.view, e));
    close(e.cy - e.ry, g.pose.topPx, 0.5);
    close(e.cx, w / 2, 1e-6);
    // The centre is off-axis (below the frame centre), so the silhouette is not the naive circle.
    assert.ok(e.cy > h / 2);
  }
});

test("silhouette ellipse matches the ray–sphere test just inside and just outside its outline", () => {
  const g = makeGlobe(1440, 800);
  const e: ScreenEllipse = { cx: 0, cy: 0, rx: 0, ry: 0 };
  silhouetteEllipse(g.view, e);
  const n = new Vector3();
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    assert.ok(surfaceNormalAt(g.view, e.cx + 0.99 * e.rx * Math.cos(a), e.cy + 0.99 * e.ry * Math.sin(a), n), `inside at ${i}`);
    assert.ok(!surfaceNormalAt(g.view, e.cx + 1.01 * e.rx * Math.cos(a), e.cy + 1.01 * e.ry * Math.sin(a), n), `outside at ${i}`);
  }
});

test("a pointer that does not move produces no rotation", () => {
  const g = makeGlobe(1440, 800);
  const before = g.q.clone();
  const axis = new Vector3();
  assert.equal(rollRotation(g.view, 700, 500, 700, 500, GRIP, axis), 0);
  assert.equal(rollRotation(g.view, 700, 500, Number.NaN, 500, GRIP, axis), 0);
  g.drag([
    [700, 500],
    [700, 500],
    [700, 500],
  ]);
  assert.ok(g.q.equals(before));
});

test("horizontal drag: the grabbed surface stays exactly under the pointer, moving right", () => {
  const g = makeGlobe(1440, 800);
  const local = g.grab(720, 560);
  g.drag(line(720, 560, 840, 560, 24));
  const p = g.screenOf(local);
  close(p.x, 840, 0.05);
  close(p.y, 560, 0.05);
});

test("vertical drag: the grabbed surface follows the pointer down (tipping the globe over the pole)", () => {
  const g = makeGlobe(1440, 800);
  const northBefore = g.northWorld();
  const local = g.grab(720, 480);
  g.drag(line(720, 480, 720, 600, 24));
  const p = g.screenOf(local);
  close(p.x, 720, 0.05);
  close(p.y, 600, 0.05);
  // Dragging down brings the north pole towards the viewer (+z), not around the polar axis.
  assert.ok(g.northWorld().z > northBefore.z + 0.05);
});

test("diagonal drag: the surface moves along the drag, both axes contribute, no twist", () => {
  const g = makeGlobe(1440, 800);
  const local = g.grab(760, 520);
  g.drag(line(760, 520, 850, 590, 30));
  const p = g.screenOf(local);
  const mx = p.x - 760;
  const my = p.y - 520;
  const cos = (mx * 90 + my * 70) / (Math.hypot(mx, my) * Math.hypot(90, 70));
  assert.ok(cos > 0.995, `moves along the drag (cos ${cos})`);
  assert.ok(Math.hypot(p.x - 850, p.y - 590) < 0.05, "ends under the pointer");
  // Every step turns about an axis in the screen plane: nothing spins about the view direction.
  const toCam = new Vector3().sub(g.view.center).normalize();
  const axis = new Vector3();
  for (const [[x0, y0], [x1, y1]] of [
    [[760, 520], [790, 545]],
    [[400, 700], [460, 640]],
    [[1100, 450], [1000, 480]],
  ]) {
    assert.ok(rollRotation(g.view, x0, y0, x1, y1, GRIP, axis) > 0);
    assert.ok(Math.abs(axis.dot(toCam)) < 1e-9);
  }
});

test("curved drag changes axis continuously (no step is larger than its pointer travel allows)", () => {
  const g = makeGlobe(1440, 800);
  const path: [number, number][] = Array.from({ length: 121 }, (_, i) => {
    const a = (i / 120) * Math.PI * 2;
    return [720 + 120 * Math.cos(a), 560 + 80 * Math.sin(a)];
  });
  const bound = (Math.hypot(120, 80) * ((Math.PI * 2) / 120)) / (GRIP.min * projectedRadiusPx(g.view));
  for (const a of g.drag(path)) assert.ok(a <= bound + 1e-9);
  assertUnitFinite(g.q);
});

test("dragging to the rim and far outside the globe stays continuous and finite", () => {
  const g = makeGlobe(1440, 800);
  const rPx = projectedRadiusPx(g.view);
  // Straight up from the globe, across the limb (~200px) and far beyond the canvas.
  const angles = g.drag(line(720, 600, 720, -4000, 460));
  const stepPx = 4600 / 460;
  for (let i = 0; i < angles.length; i++) {
    assert.ok(Number.isFinite(angles[i]) && angles[i] > 0);
    assert.ok(angles[i] <= stepPx / (GRIP.min * rPx) + 1e-9, "bounded by the minimum grip");
    if (i > 0) assert.ok(Math.abs(angles[i] - angles[i - 1]) < 0.25 * angles[i - 1], `no jump at step ${i}`);
  }
  assertUnitFinite(g.q);
  // Sideways along the outside, and a path through the corner of the canvas.
  g.drag(line(-2000, -300, 3000, -300, 200));
  g.drag(line(1440, 800, -500, -500, 200));
  assertUnitFinite(g.q);
});

test("repeated vertical drags roll the globe over the pole without locking or flipping", () => {
  const g = makeGlobe(1440, 800);
  const toCam = new Vector3().sub(g.view.center).normalize();
  let maxFacing = -1;
  let prev = g.q.clone();
  for (let stroke = 0; stroke < 12; stroke++) {
    for (const [x, y] of line(720, 420, 720, 700, 56).slice(1)) {
      g.drag([
        [x, y - 5],
        [x, y],
      ]);
      assertUnitFinite(g.q);
      assert.ok(g.q.angleTo(prev) < 0.05, "each 5px step turns the globe a little");
      prev = g.q.clone();
      maxFacing = Math.max(maxFacing, g.northWorld().dot(toCam));
    }
  }
  assert.ok(maxFacing > 0.99, `the north pole passed through the front (${maxFacing})`);
  assert.ok(g.northWorld().y < 0, "and carried on over: the globe is upside down, not clamped");
});

test("after going over the pole, a drag still moves the surface with the pointer", () => {
  const g = makeGlobe(1440, 800);
  g.drag(line(720, 300, 720, 760, 120));
  g.drag(line(720, 300, 720, 760, 120));
  g.drag(line(720, 300, 720, 760, 120));
  const local = g.grab(700, 560);
  g.drag(line(700, 560, 600, 520, 20));
  const p = g.screenOf(local);
  close(p.x, 600, 0.05);
  close(p.y, 520, 0.05);
});

test("mobile framing (globe wider than the screen): drags on the visible cap track the finger", () => {
  const g = makeGlobe(390, 640);
  const local = g.grab(195, 330);
  g.drag(line(195, 330, 255, 380, 20));
  const p = g.screenOf(local);
  assert.ok(Math.hypot(p.x - 255, p.y - 380) < 0.05, `(${p.x}, ${p.y})`);
});

test("markers stay on their coordinates and hide correctly after a multi-axis sequence", () => {
  const g = makeGlobe(1440, 800);
  g.drag(line(720, 500, 900, 700, 40));
  g.drag(line(600, 650, 700, 350, 40));
  g.drag(line(900, 450, 500, 600, 40));
  g.orient.quaternion.copy(g.q);
  g.orient.updateMatrixWorld(true);
  const center = new Vector3().setFromMatrixPosition(g.orient.matrixWorld);
  const toLocal = new Matrix4().copy(g.orient.matrixWorld).invert();
  let shown = 0;
  let hidden = 0;
  for (let lat = -60; lat <= 60; lat += 30) {
    for (let lon = -180; lon < 180; lon += 30) {
      const local = latLonToVector3(lat, lon, 1);
      const world = local.clone().applyMatrix4(g.orient.matrixWorld);
      const facing = facingCamera(world, center, ORIGIN);
      const p = projectToCss(world, g.camera, 1440, 800);
      const n = new Vector3();
      const onGlobe = surfaceNormalAt(g.view, p.x, p.y, n);
      const under = n.add(g.view.center).applyMatrix4(toLocal);
      if (facing > 0.05) {
        // Visible: the surface under the pin is the pin's own coordinate.
        assert.ok(onGlobe && under.distanceTo(local) < 1e-6, `pin ${lat},${lon} sits on its texel`);
        if (p.inFrustum) shown++;
      } else if (facing < -0.05) {
        // Behind: whatever is under that pixel is another place, and the pin is fully hidden.
        assert.equal(limbOpacity(facing), 0);
        assert.ok(!onGlobe || under.distanceTo(local) > 0.1);
        hidden++;
      }
    }
  }
  assert.ok(shown > 0 && hidden > 0, `${shown} shown, ${hidden} hidden`);
});

test("inertia decays identically at 30, 60 and 144 fps (speed and angle travelled)", () => {
  const run = (hz: number, idle: number) => {
    const q = new Quaternion();
    const omega = new Vector3(0.3, 2, 0.1);
    const target = new Vector3(0, idle, 0);
    for (let i = 0; i < hz; i++) stepSpin(q, omega, target, 1 / hz, 0.25);
    return { q, omega };
  };
  for (const idle of [0, 0.04]) {
    const a = run(30, idle);
    for (const hz of [60, 144]) {
      const b = run(hz, idle);
      assert.ok(a.omega.distanceTo(b.omega) < 1e-9, `speed at ${hz}Hz`);
      // Different axes do not commute, so allow for the tiny ordering difference.
      assert.ok(a.q.angleTo(b.q) < 2e-3, `orientation at ${hz}Hz: ${a.q.angleTo(b.q)}`);
    }
  }
  // Same axis: exact.
  const along = (hz: number) => {
    const q = new Quaternion();
    const omega = new Vector3(0, 0, 2);
    for (let i = 0; i < hz; i++) stepSpin(q, omega, new Vector3(), 1 / hz, 0.25);
    return q;
  };
  assert.ok(along(30).angleTo(along(144)) < 1e-9);
});

test("inertia keeps the fling's axis and direction, then settles into the idle spin", () => {
  const q = new Quaternion();
  const fling = new Vector3(1, -1, 0.5).setLength(2.4);
  const omega = fling.clone();
  const idle = new Vector3(0, 0.042, 0);
  const flingDir = fling.clone().normalize();
  for (let i = 0; i < 60; i++) {
    stepSpin(q, omega, idle, 1 / 60, 0.25);
    if (omega.length() > 0.5) assert.ok(omega.clone().normalize().dot(flingDir) > 0.99);
  }
  // The first second of rotation went the way the drag went.
  const axis = new Vector3(q.x, q.y, q.z).normalize();
  assert.ok(axis.dot(flingDir) > 0.99);
  for (let i = 0; i < 240; i++) stepSpin(q, omega, idle, 1 / 60, 0.45);
  assert.ok(omega.distanceTo(idle) < 1e-6, "back to the idle spin, no reset of the orientation");
  assertUnitFinite(q);
});

test("without inertia (Pause, reduced motion, stale release) the globe stays where it was left", () => {
  const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 1.2);
  const before = q.clone();
  const omega = new Vector3();
  for (let i = 0; i < 120; i++) stepSpin(q, omega, new Vector3(), 1 / 60, 0.12);
  assert.ok(q.equals(before));
  // Reduced motion uses τ = 0: any speed goes to the target at once, with no drift.
  omega.set(0, 3, 0);
  stepSpin(q, omega, new Vector3(), 1 / 60, 0);
  assert.equal(omega.length(), 0);
  assert.ok(q.equals(before));
});

test("idle spin turns about the globe's own polar axis, wherever the drag left it", () => {
  const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0.3, 0).normalize(), 2.1);
  const north = polarAxis(q, new Vector3());
  const omega = north.clone().multiplyScalar(0.042);
  for (let i = 0; i < 600; i++) stepSpin(q, omega, polarAxis(q, new Vector3()).multiplyScalar(0.042), 1 / 60, 0.45);
  assert.ok(polarAxis(q, new Vector3()).distanceTo(north) < 1e-9, "the pole does not wander");
});

test("drag velocity estimate does not depend on the pointer event rate", () => {
  const estimate = (hz: number) => {
    const v = new Vector3();
    const step = new Vector3(0, 1 / hz, 0); // a constant 1 rad/s drag
    for (let i = 0; i < hz * 0.3; i++) smoothAngularVelocity(v, step, 1 / hz, INTERACTION.velocityTau);
    return v;
  };
  assert.ok(estimate(60).distanceTo(estimate(240)) < 1e-9);
  close(estimate(60).y, 1, 0.01);
  close(decayFactor(0.1, 0), 0);
  close(decayFactor(0, 0.25), 1);
});
