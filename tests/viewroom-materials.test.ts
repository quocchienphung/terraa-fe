import { test } from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshPhongMaterial, MultiplyBlending, Texture } from "three";
import { applyMaterialOverrides, applyTextureReplacesColor } from "../src/lib/viewroom/adapters/meshAdapter.ts";
import { TOKYO_PROTOTYPE } from "../src/lib/viewroom/viewerManifest.ts";

test("FBX semantics: a diffuse texture replaces the material colour instead of being tinted by it", () => {
  // Tokyo's "paintmat" is red and "Plastic_Soft" orange in the FBX; both carry the atlas as map.
  const paint = new MeshPhongMaterial({ color: 0xdc1e1e, map: new Texture() });
  const plain = new MeshPhongMaterial({ color: 0x969696 }); // no texture: colour is the surface
  const root = new Group();
  root.add(new Mesh(new BoxGeometry(), [paint, plain]));
  applyTextureReplacesColor(root);
  assert.equal(paint.color.getHex(), 0xffffff);
  assert.equal(plain.color.getHex(), 0x969696);
});

test("an emissive map with a black emissive colour becomes visible", () => {
  const m = new MeshPhongMaterial({ emissive: 0x000000, emissiveMap: new Texture() });
  const root = new Group();
  root.add(new Mesh(new BoxGeometry(), m));
  applyTextureReplacesColor(root);
  assert.equal(m.emissive.getHex(), 0xffffff);
});

test("shadow-decal override: unlit multiply material, no shadow casting, texture kept", () => {
  const map = new Texture();
  const original = new MeshPhongMaterial({ color: 0x969696, map });
  original.name = "Material #5516";
  const decal: Mesh = new Mesh(new BoxGeometry(), original);
  decal.castShadow = true;
  const other = new Mesh(new BoxGeometry(), new MeshPhongMaterial({ name: "normal" }));
  const root = new Group();
  root.add(decal, other);
  let disposed = 0;
  original.addEventListener("dispose", () => disposed++);

  applyMaterialOverrides(root, TOKYO_PROTOTYPE.mesh?.materialOverrides);

  const m = decal.material as unknown as MeshBasicMaterial;
  assert.ok(m instanceof MeshBasicMaterial);
  assert.equal(m.blending, MultiplyBlending);
  assert.equal(m.map, map);
  assert.equal(m.depthWrite, false);
  assert.equal(decal.castShadow, false);
  assert.equal(decal.userData.terraRole, "shadow-decal");
  assert.equal(disposed, 1, "replaced material is released");
  assert.ok(other.material instanceof MeshPhongMaterial, "unrelated materials untouched");
});
