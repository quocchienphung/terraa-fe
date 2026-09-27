import {
  Box3,
  LoaderUtils,
  LoadingManager,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MultiplyBlending,
  type AnimationClip,
  type Color,
  type Material,
  type Mesh,
  type Object3D,
  type Texture,
} from "three";
import { createResourceResolver, PLACEHOLDER_IMAGE, type ResolutionReport } from "../assetResolver.ts";
import { fetchAsset } from "./fetchAsset.ts";
import { disposeObject } from "../disposeObject.ts";
import { ViewerError, type AssetStats, type AssetWarning, type MeshOptions, type Terra3DAsset } from "../viewerTypes.ts";
import { once, throwIfAborted, type AdapterContext, type AssetAdapter, type AssetHandle } from "./adapterTypes.ts";

type MeshAsset = Extract<Terra3DAsset, { kind: "mesh" }>;

/** Waits for every resource the manager started (textures, buffers) and reports item progress. */
function trackManager(manager: LoadingManager, ctx: AdapterContext) {
  let started = false;
  let settled = false;
  let done = 0;
  let total = 0;
  const failed: string[] = [];
  let resolveIdle: (() => void) | null = null;
  manager.onStart = () => {
    started = true;
  };
  manager.onProgress = (_url, loaded, count) => {
    started = true;
    done = loaded;
    total = count;
    ctx.onProgress({ phase: "preparing", items: { done, total } });
  };
  manager.onError = (url) => {
    // Report names only, never full (possibly signed) URLs.
    failed.push(url.split(/[?#]/, 1)[0].split("/").pop() ?? "resource");
  };
  manager.onLoad = () => {
    settled = true;
    resolveIdle?.();
  };
  return {
    failed,
    idle(): Promise<void> {
      if (!started || settled || (total > 0 && done === total)) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        resolveIdle = resolve;
        ctx.signal.addEventListener("abort", () => reject(new DOMException("Load superseded", "AbortError")), { once: true });
      });
    },
  };
}

function resourceBase(asset: MeshAsset): string {
  const policy = asset.resources;
  if (policy?.type === "remote") return policy.baseUrl.endsWith("/") ? policy.baseUrl : `${policy.baseUrl}/`;
  if (policy?.type === "local") return "";
  if (asset.url.startsWith("blob:") || asset.url.startsWith("data:")) return "";
  return LoaderUtils.extractUrlBase(asset.url);
}

const TEXTURE_SLOTS = [
  "map", "alphaMap", "aoMap", "bumpMap", "normalMap", "emissiveMap", "specularMap",
  "lightMap", "roughnessMap", "metalnessMap", "displacementMap", "envMap",
] as const;
type Slot = (typeof TEXTURE_SLOTS)[number];

function imageSrc(tex: Texture | null | undefined): string | null {
  const img = tex?.image as { src?: string; currentSrc?: string } | undefined;
  return img?.currentSrc || img?.src || null;
}

function materialsOf(root: Object3D): Material[] {
  const set = new Set<Material>();
  root.traverse((o) => {
    const m = (o as Mesh).material;
    if (!m) return;
    for (const mat of Array.isArray(m) ? m : [m]) set.add(mat);
  });
  return [...set];
}

/**
 * Post-load material fixes, each driven by evidence rather than by the asset's name:
 * 1. Texture slots whose file is known missing are cleared (the material keeps its own colour)
 *    instead of sampling a placeholder.
 * 2. When `alphaMap` and `map` are the same image, the author meant "cut out by this texture's
 *    alpha". three's alphaMap reads the green channel, so it is replaced by an alpha test on the map.
 */
function fixMaterials(root: Object3D, asset: MeshAsset, report: ResolutionReport, warnings: AssetWarning[]) {
  const stripped = new Set<string>();
  let alphaFixed = 0;
  for (const mat of materialsOf(root)) {
    const slots = mat as unknown as Partial<Record<Slot, Texture | null>>;
    for (const slot of TEXTURE_SLOTS) {
      const tex = slots[slot];
      if (tex && imageSrc(tex) === PLACEHOLDER_IMAGE) {
        slots[slot] = null;
        tex.dispose();
        stripped.add(`${mat.name || "material"}.${slot}`);
      }
    }
    const map = slots.map;
    const alphaMap = slots.alphaMap;
    if (map && alphaMap && imageSrc(map) && imageSrc(map) === imageSrc(alphaMap)) {
      slots.alphaMap = null;
      alphaMap.dispose();
      mat.alphaTest = asset.mesh?.alphaTest ?? 0.5;
      if (mat.opacity >= 1) {
        mat.transparent = false;
        mat.depthWrite = true;
      }
      alphaFixed++;
    }
    mat.needsUpdate = true;
  }
  if (asset.format === "fbx" && asset.mesh?.textureReplacesColor !== false) applyTextureReplacesColor(root);
  applyMaterialOverrides(root, asset.mesh?.materialOverrides);
  if (report.missing.length > 0) {
    warnings.push({
      code: "missing-texture",
      message: `Not supplied with the asset: ${report.missing.join(", ")}. ${
        stripped.size > 0 ? "Affected surfaces show their base material colour." : ""
      }`.trim(),
    });
  }
  if (report.ambiguous.length > 0) {
    warnings.push({
      code: "ambiguous-resource",
      message: `More than one selected file matches: ${report.ambiguous.join(", ")}. Select only one of each.`,
    });
  }
  if (alphaFixed > 0) {
    warnings.push({
      code: "alpha-from-map",
      message: `${alphaFixed} material${alphaFixed > 1 ? "s use" : " uses"} the colour texture's alpha channel as a cut-out.`,
    });
  }
}

type ColorSlots = { color?: Color; emissive?: Color; map?: Texture | null; emissiveMap?: Texture | null };

/**
 * In FBX (and the DCC tools that write it) a texture connected to Diffuse/Emissive replaces the
 * colour value; FBXLoader keeps the colour and three multiplies it with the texture, which tints
 * the whole atlas (e.g. Tokyo's red "paintmat", orange "Plastic_Soft", 60% grey props).
 */
export function applyTextureReplacesColor(root: Object3D) {
  for (const mat of materialsOf(root)) {
    const m = mat as unknown as ColorSlots;
    if (m.map && m.color) m.color.setRGB(1, 1, 1);
    if (m.emissiveMap && m.emissive && m.emissive.getHex() === 0) m.emissive.setRGB(1, 1, 1);
  }
}

export function applyMaterialOverrides(root: Object3D, overrides: MeshOptions["materialOverrides"]) {
  if (!overrides) return;
  const replaced = new Map<Material, Material>();
  const swap = (mat: Material): Material => {
    const rule = overrides[mat.name];
    if (!rule || rule.role !== "shadow-decal") return mat;
    let next = replaced.get(mat);
    if (!next) {
      next = new MeshBasicMaterial({
        map: (mat as unknown as ColorSlots).map ?? null,
        color: 0xffffff,
        blending: MultiplyBlending,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
        toneMapped: false,
      });
      next.name = mat.name;
      replaced.set(mat, next);
      mat.dispose();
    }
    return next;
  };
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const before = mesh.material;
    mesh.material = Array.isArray(before) ? before.map(swap) : swap(before);
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (mats.some((m) => replaced.has(m) || [...replaced.values()].includes(m))) {
      mesh.userData.terraRole = "shadow-decal";
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }
  });
}

function collectStats(root: Object3D, animations: AnimationClip[]): AssetStats {
  let meshes = 0;
  let triangles = 0;
  const textures = new Set<Texture>();
  const mats = materialsOf(root);
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    meshes++;
    const g = mesh.geometry;
    triangles += Math.floor((g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3);
  });
  for (const m of mats) {
    for (const v of Object.values(m)) if (v && typeof v === "object" && (v as Texture).isTexture) textures.add(v as Texture);
  }
  return { meshes, triangles, materials: mats.length, textures: textures.size, animations: animations.length };
}

/** Reads the JSON chunk of a .glb, or the whole .gltf text. `null` if it cannot be parsed. */
export function readGltfJson(format: "glb" | "gltf", bytes: Uint8Array): { extensionsUsed?: string[]; extensionsRequired?: string[] } | null {
  try {
    if (format === "gltf") return JSON.parse(new TextDecoder().decode(bytes));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (view.getUint32(0, true) !== 0x46546c67) return null; // "glTF"
    const len = view.getUint32(12, true);
    return JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + len)));
  } catch {
    return null;
  }
}

/**
 * Refuses glTF variants the mesh path would misrepresent. Gaussian splats stored in glTF
 * (KHR_gaussian_splatting) would render as a plain point cloud, which is not Gaussian rendering.
 */
export function checkGltfSupport(format: "glb" | "gltf", bytes: Uint8Array) {
  const json = readGltfJson(format, bytes);
  if (!json) return;
  const used = [...(json.extensionsUsed ?? []), ...(json.extensionsRequired ?? [])];
  if (used.some((e) => /gaussian_splatting/i.test(e))) {
    throw new ViewerError(
      "unsupported-format",
      "This glTF stores Gaussian splats (KHR_gaussian_splatting). The installed Spark renderer does not read splats from glTF, and showing them as points would misrepresent the scan.",
      ["Export the splat as PLY, SPZ or SOG to view it here."],
    );
  }
}

async function parseMesh(
  asset: MeshAsset,
  bytes: Uint8Array<ArrayBuffer>,
  manager: LoadingManager,
  base: string,
  resolve: (url: string) => string,
  warnings: AssetWarning[],
): Promise<{ root: Object3D; animations: AnimationClip[] }> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  switch (asset.format) {
    case "fbx": {
      const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader.js");
      const loader = new FBXLoader(manager);
      if (base) loader.setResourcePath(base);
      const root = loader.parse(buffer, base);
      return { root, animations: root.animations };
    }
    case "glb":
    case "gltf": {
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader(manager);
      const gltf = await loader.parseAsync(buffer, base);
      return { root: gltf.scene, animations: gltf.animations };
    }
    case "obj": {
      const [{ OBJLoader }, { MTLLoader }] = await Promise.all([
        import("three/examples/jsm/loaders/OBJLoader.js"),
        import("three/examples/jsm/loaders/MTLLoader.js"),
      ]);
      const text = new TextDecoder().decode(bytes);
      const loader = new OBJLoader(manager);
      const mtlName = /^mtllib\s+(.+?)\s*$/m.exec(text)?.[1];
      let materialsLoaded = false;
      if (mtlName) {
        const mtlUrl = resolve(base + mtlName);
        if (!mtlUrl.startsWith("data:")) {
          try {
            const mtl = new MTLLoader(manager);
            mtl.setResourcePath(base);
            const creator = await mtl.loadAsync(base + mtlName);
            creator.preload();
            loader.setMaterials(creator);
            materialsLoaded = true;
          } catch {
            // fall through to neutral materials with a warning
          }
        }
      }
      const root = loader.parse(text);
      if (!materialsLoaded) {
        const neutral = new MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.85, metalness: 0 });
        root.traverse((o) => {
          const mesh = o as Mesh;
          if (!mesh.isMesh) return;
          const old = mesh.material;
          for (const m of Array.isArray(old) ? old : [old]) m.dispose();
          mesh.material = neutral;
        });
        warnings.push({
          code: "neutral-material",
          message: mtlName
            ? `Material library ${mtlName} was not supplied; showing a neutral material.`
            : "This OBJ has no material library; showing a neutral material.",
        });
      }
      return { root, animations: [] };
    }
  }
}

function describeDecodeError(asset: MeshAsset, err: unknown): ViewerError {
  if (err instanceof ViewerError) return err;
  const msg = String((err as Error)?.message ?? err);
  if (/draco/i.test(msg)) return new ViewerError("decode-failed", "This glTF uses Draco compression, which this viewer does not decode yet.");
  if (/ktx2|basis/i.test(msg)) return new ViewerError("decode-failed", "This glTF uses KTX2 textures, which this viewer does not decode yet.");
  if (/meshopt/i.test(msg)) return new ViewerError("decode-failed", "This glTF uses Meshopt compression, which this viewer does not decode yet.");
  return new ViewerError("decode-failed", `The ${asset.format.toUpperCase()} file could not be read. It may be corrupt or use an unsupported variant.`, [msg]);
}

export const meshAdapter: AssetAdapter = {
  kind: "mesh",
  async load(asset, ctx): Promise<AssetHandle> {
    if (asset.kind !== "mesh") throw new ViewerError("unsupported-format", "Mesh adapter received a non-mesh asset.");
    const bytes = await fetchAsset(asset.url, ctx);
    throwIfAborted(ctx.signal);
    if (asset.format === "glb" || asset.format === "gltf") checkGltfSupport(asset.format, bytes);

    ctx.onProgress({ phase: "decoding" });
    const manager = new LoadingManager();
    const { resolve, report } = createResourceResolver(asset.resources);
    manager.setURLModifier(resolve);
    const tracker = trackManager(manager, ctx);
    const abort = () => manager.abort();
    ctx.signal.addEventListener("abort", abort, { once: true });
    const warnings: AssetWarning[] = [];

    let parsed: { root: Object3D; animations: AnimationClip[] } | null = null;
    try {
      // Let the "decoding" state paint before a long synchronous parse.
      await new Promise((r) => setTimeout(r, 0));
      parsed = await parseMesh(asset, bytes, manager, resourceBase(asset), resolve, warnings);
      throwIfAborted(ctx.signal);
      ctx.onProgress({ phase: "preparing" });
      await tracker.idle();
      throwIfAborted(ctx.signal);
    } catch (err) {
      if (parsed) disposeObject(parsed.root);
      if (ctx.signal.aborted) throw err;
      if (report.missing.length > 0 && asset.format !== "fbx") {
        throw new ViewerError("missing-resources", "Some files this model needs were not supplied.", report.missing);
      }
      throw describeDecodeError(asset, err);
    } finally {
      ctx.signal.removeEventListener("abort", abort);
    }

    const { root, animations } = parsed;
    fixMaterials(root, asset, report, warnings);
    if (tracker.failed.length > 0) {
      warnings.push({ code: "missing-texture", message: `Could not load: ${tracker.failed.join(", ")}.` });
    }
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    if (box.isEmpty()) {
      disposeObject(root);
      throw new ViewerError("decode-failed", "The model loaded but contains no visible geometry.");
    }
    return {
      kind: "mesh",
      root,
      bounds: { min: box.min.toArray(), max: box.max.toArray() },
      stats: collectStats(root, animations),
      warnings,
      needsLights: true,
      animations,
      dispose: once(() => disposeObject(root)),
    };
  },
};
