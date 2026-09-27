import { test } from "node:test";
import assert from "node:assert/strict";
import { detectFormat, fileExtension, FORMAT_REGISTRY } from "../src/lib/viewroom/detectFormat.ts";
import { assetFromUrl, DEV_FIXTURES, manifestToAsset, TOKYO_PROTOTYPE } from "../src/lib/viewroom/viewerManifest.ts";
import { ViewerError, type TerraModelManifest } from "../src/lib/viewroom/viewerTypes.ts";

test("fileExtension strips query/hash, is case-insensitive, handles Windows paths", () => {
  assert.equal(fileExtension("/models/tree-034/Model.SPZ?sig=abc#x"), "spz");
  assert.equal(fileExtension("C:\\author\\scene\\Export.FBX"), "fbx");
  assert.equal(fileExtension("/3d%20tokyo/source/Export.fbx"), "fbx");
  assert.equal(fileExtension("/no-extension"), "");
  assert.equal(fileExtension("/.hidden"), "");
  assert.equal(fileExtension("/trailing."), "");
});

test("detectFormat routes every registered extension to its kind", () => {
  for (const [format, entry] of Object.entries(FORMAT_REGISTRY)) {
    assert.deepEqual(detectFormat(`/a/b.${format}`), { kind: entry.kind, format });
  }
  assert.equal(detectFormat("/a/b.stl"), null);
  assert.equal(detectFormat("/a/b"), null);
});

test("blob URLs are identified only by the stored file name", () => {
  const blob = "blob:http://localhost/1b2c-uuid";
  assert.equal(detectFormat(blob), null);
  assert.deepEqual(detectFormat(blob, "scan.KSPLAT"), { kind: "gaussian-splat", format: "ksplat" });
  assert.deepEqual(detectFormat(blob, "street.glb"), { kind: "mesh", format: "glb" });
});

test("manifestToAsset keeps explicit kind/format and refuses contradictions", () => {
  const tokyo = manifestToAsset(TOKYO_PROTOTYPE);
  assert.equal(tokyo.kind, "mesh");
  assert.equal(tokyo.format, "fbx");
  assert.equal(tokyo.resources?.type, "remote");

  const splat = manifestToAsset(DEV_FIXTURES[0]);
  assert.equal(splat.kind, "gaussian-splat");

  const bad: TerraModelManifest = { ...TOKYO_PROTOTYPE, kind: "gaussian-splat" };
  assert.throws(() => manifestToAsset(bad), (e: unknown) => e instanceof ViewerError && e.code === "unsupported-format");
});

test("assetFromUrl builds the future point_cloud.ply / model.spz contracts", () => {
  assert.deepEqual(assetFromUrl("/models/tree-034/point_cloud.ply"), {
    url: "/models/tree-034/point_cloud.ply",
    fileName: undefined,
    kind: "gaussian-splat",
    format: "ply",
  });
  assert.equal(assetFromUrl("/models/tree-034/model.spz").format, "spz");
  assert.throws(() => assetFromUrl("/models/tree-034/model.usdz"), ViewerError);
});

test("the prototype is labelled as a prototype, fixtures as fixtures", () => {
  assert.equal(TOKYO_PROTOTYPE.origin, "prototype");
  assert.ok(DEV_FIXTURES.every((f) => f.origin === "dev-fixture" && f.kind === "gaussian-splat"));
  assert.equal(TOKYO_PROTOTYPE.treeId, undefined, "a sample model must not claim a tree");
});
