import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createResourceResolver,
  matchLocalResource,
  normalizeResourcePath,
  PLACEHOLDER_EMPTY,
  PLACEHOLDER_IMAGE,
} from "../src/lib/viewroom/assetResolver.ts";
import { pickMainEntry, relativePathOf, MAX_LOCAL_FILE_BYTES } from "../src/lib/viewroom/localBundle.ts";
import { TOKYO_PROTOTYPE } from "../src/lib/viewroom/viewerManifest.ts";
import { ViewerError, type LocalResource } from "../src/lib/viewroom/viewerTypes.ts";

const BASE = "/3d%20tokyo/textures/";

test("Tokyo: FBX .psd references resolve to the shipped JPG/PNG with exact case", () => {
  const { resolve, report } = createResourceResolver(TOKYO_PROTOTYPE.resources);
  assert.equal(resolve(`${BASE}Atlas.psd`), `${BASE}Atlas.jpg`);
  assert.equal(resolve(`${BASE}props_alpha.psd`), `${BASE}props_alpha.png`);
  assert.equal(resolve(`${BASE}ATLAS.PSD`), `${BASE}Atlas.jpg`);
  assert.deepEqual(report.aliased.sort(), ["ATLAS.PSD → Atlas.jpg", "Atlas.psd → Atlas.jpg", "props_alpha.psd → props_alpha.png"].sort());
});

test("Tokyo: existing files are untouched and LM_Final.tga resolves to the supplied JPG", () => {
  const { resolve, report } = createResourceResolver(TOKYO_PROTOTYPE.resources);
  assert.equal(resolve(`${BASE}Interiors.jpg`), `${BASE}Interiors.jpg`);
  assert.equal(resolve(`${BASE}props_alpha.png`), `${BASE}props_alpha.png`);
  assert.equal(resolve(`${BASE}LM_Final.tga`), `${BASE}LM_Final.jpg`);
  assert.deepEqual(report.missing, []);
  // No generic fallback: an unknown texture is not silently mapped to the atlas.
  assert.equal(resolve(`${BASE}Unknown.png`), `${BASE}Unknown.png`);
});

test("declared-missing resources get a placeholder without a network request", () => {
  const { resolve, report } = createResourceResolver({ type: "remote", baseUrl: BASE, missing: ["lm_final.tga"] });
  assert.equal(resolve(`${BASE}LM_Final.tga`), PLACEHOLDER_IMAGE);
  assert.deepEqual(report.missing, ["LM_Final.tga"]);
});

test("blob: and data: URLs always pass through", () => {
  const { resolve } = createResourceResolver(TOKYO_PROTOTYPE.resources);
  assert.equal(resolve("blob:http://x/abc"), "blob:http://x/abc");
  assert.equal(resolve("data:image/png;base64,AAA"), "data:image/png;base64,AAA");
});

test("path normalisation handles author Windows paths and %20", () => {
  assert.equal(normalizeResourcePath("..\\props\\props_alpha.psd"), "props/props_alpha.psd");
  assert.equal(normalizeResourcePath("./textures/My%20Wall.png"), "textures/My Wall.png");
});

const files: LocalResource[] = [
  { path: "scene.bin", url: "blob:bin", size: 10 },
  { path: "textures/wall.png", url: "blob:wall", size: 10 },
  { path: "a/roof.jpg", url: "blob:roof-a", size: 10 },
  { path: "b/roof.jpg", url: "blob:roof-b", size: 10 },
];

test("local bundle: exact path, suffix and unique basename matches", () => {
  assert.equal(matchLocalResource(files, "scene.bin").kind, "found");
  const wall = matchLocalResource(files, "textures/wall.png");
  assert.ok(wall.kind === "found" && wall.file.url === "blob:wall");
  const byName = matchLocalResource(files, "C:\\Users\\author\\maps\\wall.png");
  assert.ok(byName.kind === "found" && byName.file.url === "blob:wall");
  const suffix = matchLocalResource(files, "b/roof.jpg");
  assert.ok(suffix.kind === "found" && suffix.file.url === "blob:roof-b");
});

test("local bundle: duplicate basenames are reported as ambiguous, not guessed", () => {
  const m = matchLocalResource(files, "roof.jpg");
  assert.equal(m.kind, "ambiguous");
  const { resolve, report } = createResourceResolver({ type: "local", files });
  assert.equal(resolve("roof.jpg"), PLACEHOLDER_IMAGE);
  assert.deepEqual(report.ambiguous, ["roof.jpg"]);
});

test("local bundle: missing files and absolute URLs never leave the selection", () => {
  const { resolve, report } = createResourceResolver({ type: "local", files });
  assert.equal(resolve("https://cdn.example.com/evil.bin"), PLACEHOLDER_EMPTY);
  assert.equal(resolve("missing.png"), PLACEHOLDER_IMAGE);
  assert.deepEqual(report.missing.sort(), ["evil.bin", "missing.png"]);
});

test("selection rules: exactly one model, sidecars kept, junk ignored", () => {
  const r = pickMainEntry([
    { path: "scene.gltf", size: 100 },
    { path: "scene.bin", size: 100 },
    { path: "notes.txt", size: 5 },
  ]);
  assert.equal(r.main, 0);
  assert.deepEqual(r.ignored, ["notes.txt"]);
  const code = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      return e instanceof ViewerError ? e.code : "other";
    }
    return "none";
  };
  assert.equal(code(() => pickMainEntry([])), "empty-file");
  assert.equal(code(() => pickMainEntry([{ path: "a.png", size: 5 }])), "unsupported-format");
  assert.equal(code(() => pickMainEntry([{ path: "a.glb", size: 5 }, { path: "b.spz", size: 5 }])), "ambiguous-selection");
  assert.equal(code(() => pickMainEntry([{ path: "a.glb", size: 0 }])), "empty-file");
  assert.equal(code(() => pickMainEntry([{ path: "a.ply", size: MAX_LOCAL_FILE_BYTES + 1 }])), "too-large");
});

test("relative paths strip the chosen folder name", () => {
  const f = (name: string, rel: string) => ({ name, webkitRelativePath: rel }) as unknown as File;
  assert.equal(relativePathOf(f("wall.png", "bundle/textures/wall.png")), "textures/wall.png");
  assert.equal(relativePathOf(f("scene.gltf", "")), "scene.gltf");
});
