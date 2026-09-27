import { test } from "node:test";
import assert from "node:assert/strict";
import { openSync, readSync, closeSync } from "node:fs";
import { isGaussianPly, parsePlyHeader, readPlyHeader } from "../src/lib/viewroom/plyHeader.ts";
import { validateGaussianBytes } from "../src/lib/viewroom/adapters/splatAdapter.ts";
import { ViewerError } from "../src/lib/viewroom/viewerTypes.ts";

const head = (path: string, n = 4096) => {
  const fd = openSync(path, "r");
  const buf = Buffer.alloc(n);
  const read = readSync(fd, buf, 0, n, 0);
  closeSync(fd);
  return new Uint8Array(buf.subarray(0, read));
};
const bytes = (text: string) => new Uint8Array(Buffer.from(text, "latin1"));

test("real fixture: standard 3DGS PLY schema is classified as Gaussian", () => {
  const info = parsePlyHeader(readPlyHeader(head("public/viewroom/fixtures/guitar.point_cloud.ply"))!);
  assert.equal(info.classification, "gaussian");
  assert.equal(info.count, 90854);
  assert.equal(validateGaussianBytes("ply", head("public/viewroom/fixtures/guitar.point_cloud.ply")).count, 90854);
});

test("real fixture: SuperSplat compressed PLY is Gaussian despite different field names", () => {
  const info = parsePlyHeader(readPlyHeader(head("public/viewroom/fixtures/guitar.compressed.ply"))!);
  assert.equal(info.classification, "gaussian-compressed");
  assert.ok(isGaussianPly(info));
});

test("a polygon-mesh PLY is not Gaussian and is refused with a specific error", () => {
  const mesh = bytes("ply\nformat binary_little_endian 1.0\nelement vertex 8\nproperty float x\nproperty float y\nproperty float z\nelement face 12\nproperty list uchar int vertex_indices\nend_header\n");
  assert.equal(parsePlyHeader(readPlyHeader(mesh)!).classification, "mesh");
  assert.throws(() => validateGaussianBytes("ply", mesh), (e: unknown) => e instanceof ViewerError && e.code === "not-gaussian-ply" && /polygon mesh/.test(e.message));
});

test("a plain XYZ/RGB point cloud PLY is not Gaussian", () => {
  const pc = bytes("ply\nformat ascii 1.0\nelement vertex 3\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n");
  assert.equal(parsePlyHeader(readPlyHeader(pc)!).classification, "point-cloud");
  assert.throws(() => validateGaussianBytes("ply", pc), (e: unknown) => e instanceof ViewerError && /point cloud/.test(e.message));
});

test("non-PLY bytes and truncated headers are rejected", () => {
  assert.equal(readPlyHeader(bytes("solid cube\nfacet normal")), null);
  assert.equal(readPlyHeader(bytes("ply\nformat binary_little_endian 1.0\nelement vertex 3\n")), null);
  assert.throws(() => validateGaussianBytes("ply", bytes("glTF....")), ViewerError);
});

test("SPZ: gzip container accepted, raw v4 container refused with a precise message", () => {
  assert.deepEqual(validateGaussianBytes("spz", head("public/viewroom/fixtures/guitar.spz", 16)), {});
  // Header of a real SPZ v4 file (verified in the browser: Spark 2.2 reports "Invalid gzip header").
  const v4 = new Uint8Array([0x4e, 0x47, 0x53, 0x50, 0x04, 0, 0, 0, 0xaa, 0x54, 0x02, 0]);
  assert.throws(() => validateGaussianBytes("spz", v4), (e: unknown) => e instanceof ViewerError && e.code === "unsupported-format" && /version 4/.test(e.message));
  assert.throws(() => validateGaussianBytes("spz", bytes("hello")), ViewerError);
});

test("SOG must be a bundled ZIP", () => {
  assert.deepEqual(validateGaussianBytes("sog", new Uint8Array([0x50, 0x4b, 3, 4])), {});
  assert.throws(() => validateGaussianBytes("sog", bytes('{"means":{}}')), (e: unknown) => e instanceof ViewerError && /bundled/.test(e.message));
});
