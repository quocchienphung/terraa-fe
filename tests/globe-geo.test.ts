import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, SphereGeometry, Vector3 } from "three";
import {
  facingCamera,
  latLonToVector3,
  limbOpacity,
  projectToCss,
  shortestAngleDelta,
  spinToFaceLongitude,
} from "../src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/project-markers.ts";

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("lat/lon lands on the SphereGeometry vertex whose UV samples that lat/lon", () => {
  // An equirectangular texture maps u = (lon + 180) / 360 and v = (lat + 90) / 180.
  // If this fails, pins and texture disagree (flipped longitude or a 180° offset).
  const geo = new SphereGeometry(1, 360, 180);
  const pos = geo.getAttribute("position");
  const uv = geo.getAttribute("uv");
  const places: [string, number, number][] = [
    ["Dallas", 32.78, -96.8],
    ["Rotterdam", 51.92, 4.48],
    ["Adelaide", -34.93, 138.6],
    ["Santiago", -33.45, -70.67],
  ];
  for (const [name, lat, lon] of places) {
    const lonR = Math.round(lon);
    const latR = Math.round(lat);
    const u = (lonR + 180) / 360;
    const v = (latR + 90) / 180;
    let found = -1;
    for (let i = 0; i < uv.count; i++) {
      if (Math.abs(uv.getX(i) - u) < 1e-6 && Math.abs(uv.getY(i) - v) < 1e-6) {
        found = i;
        break;
      }
    }
    assert.ok(found >= 0, `no vertex for ${name}`);
    const expected = new Vector3(pos.getX(found), pos.getY(found), pos.getZ(found));
    assert.ok(latLonToVector3(latR, lonR).distanceTo(expected) < 1e-5, name);
  }
});

test("axis convention: lon 0 → +X, 90°E → −Z, north pole → +Y", () => {
  const a = latLonToVector3(0, 0);
  close(a.x, 1);
  const e = latLonToVector3(0, 90);
  close(e.z, -1);
  const n = latLonToVector3(90, 17);
  close(n.y, 1);
});

test("spinToFaceLongitude turns each longitude to face +Z", () => {
  for (const lon of [-179, -101.8, -70.67, 0, 4.48, 74, 138.6, 180]) {
    const v = latLonToVector3(0, lon).applyAxisAngle(new Vector3(0, 1, 0), spinToFaceLongitude(lon));
    close(v.z, 1, 1e-9);
  }
});

test("east appears to the right of the facing longitude", () => {
  const spin = spinToFaceLongitude(-97);
  const eastOf = latLonToVector3(0, -90).applyAxisAngle(new Vector3(0, 1, 0), spin);
  assert.ok(eastOf.x > 0);
});

test("shortestAngleDelta crosses ±π the short way", () => {
  close(shortestAngleDelta(0.1, Math.PI * 2 - 0.1), -0.2);
  close(shortestAngleDelta(Math.PI * 2 - 0.1, 0.1 + Math.PI * 4), 0.2);
  close(shortestAngleDelta(0, Math.PI), Math.PI);
});

test("perspective occlusion hides points a z-based test would wrongly show", () => {
  const center = new Vector3(0, 0, 0);
  const cam = new Vector3(0, 0, 3);
  // 85° from the view axis: z > 0 (naive test says visible), but a camera at distance 3
  // only sees the cap within acos(1/3) ≈ 70.5°.
  const a = (85 * Math.PI) / 180;
  const p = new Vector3(Math.sin(a), 0, Math.cos(a));
  assert.ok(p.z > 0);
  assert.ok(facingCamera(p, center, cam) < 0);
  assert.equal(limbOpacity(facingCamera(p, center, cam)), 0);
  const b = (60 * Math.PI) / 180;
  assert.ok(facingCamera(new Vector3(Math.sin(b), 0, Math.cos(b)), center, cam) > 0);
  assert.equal(limbOpacity(facingCamera(new Vector3(0, 0, 1), center, cam)), 1);
});

test("projectToCss returns CSS pixels independent of device pixel ratio", () => {
  const camera = new PerspectiveCamera(30, 1440 / 800, 0.1, 100);
  camera.updateMatrixWorld();
  const mid = projectToCss(new Vector3(0, 0, -5), camera, 1440, 800);
  close(mid.x, 720);
  close(mid.y, 400);
  assert.ok(mid.inFrustum);
  const up = projectToCss(new Vector3(0, 1, -5), camera, 1440, 800);
  assert.ok(up.y < 400);
  const behind = projectToCss(new Vector3(0, 0, 5), camera, 1440, 800);
  assert.equal(behind.inFrustum, false);
});
