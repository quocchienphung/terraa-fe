import { test } from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Texture } from "three";
import { disposeObject } from "../src/lib/viewroom/disposeObject.ts";
import { isAbortError, once, throwIfAborted } from "../src/lib/viewroom/adapters/adapterTypes.ts";

function counted<T extends { addEventListener: (t: "dispose", cb: () => void) => void }>(res: T, tally: Map<unknown, number>) {
  tally.set(res, 0);
  res.addEventListener("dispose", () => tally.set(res, (tally.get(res) ?? 0) + 1));
  return res;
}

test("disposes geometry, material and every texture slot exactly once, even when shared", () => {
  const tally = new Map<unknown, number>();
  const geo = counted(new BoxGeometry(), tally);
  const map = counted(new Texture(), tally);
  const alpha = counted(new Texture(), tally);
  const mat = counted(new MeshStandardMaterial({ map, alphaMap: alpha }), tally);
  const root = new Group();
  root.add(new Mesh(geo, mat), new Mesh(geo, [mat, mat]));
  const objectEvents: Object3D[] = [];
  root.traverse((o) => o.addEventListener("dispose", () => objectEvents.push(o)));
  const released = disposeObject(root);
  // 4 GPU resources + 3 objects (three r186 Object3D.dispose() lets renderers drop per-object state).
  assert.equal(released, 7);
  assert.equal(objectEvents.length, 3);
  for (const [, n] of tally) assert.equal(n, 1);
});

test("resources shared with something else can be kept", () => {
  const tally = new Map<unknown, number>();
  const shared = counted(new Texture(), tally);
  const own = counted(new BoxGeometry(), tally);
  const root = new Group();
  root.add(new Mesh(own, new MeshStandardMaterial({ map: shared })));
  disposeObject(root, new Set([shared]));
  assert.equal(tally.get(shared), 0);
  assert.equal(tally.get(own), 1);
});

test("objects with their own dispose() (e.g. Spark SplatMesh) are released", () => {
  let calls = 0;
  const splatLike = new Object3D() as Object3D & { dispose: () => void };
  splatLike.dispose = () => {
    calls++;
  };
  const root = new Group();
  root.add(splatLike);
  disposeObject(root);
  assert.equal(calls, 1);
});

test("asset handles dispose idempotently", () => {
  let n = 0;
  const dispose = once(() => n++);
  dispose();
  dispose();
  assert.equal(n, 1);
});

test("superseded loads surface as AbortError and are ignored, not shown as failures", () => {
  const ac = new AbortController();
  throwIfAborted(ac.signal);
  ac.abort();
  assert.throws(() => throwIfAborted(ac.signal), (e: unknown) => isAbortError(e));
  assert.equal(isAbortError(new Error("network")), false);
});
