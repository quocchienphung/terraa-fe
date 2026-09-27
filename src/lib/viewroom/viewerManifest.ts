import { FORMAT_REGISTRY, detectFormat, formatLabel } from "./detectFormat.ts";
import { ViewerError, type Terra3DAsset, type TerraModelManifest } from "./viewerTypes.ts";

/**
 * Converts a manifest into the render contract. The declared kind must agree with the declared
 * format — a manifest can never route a mesh PLY or an FBX into the Gaussian renderer.
 */
export function manifestToAsset(m: TerraModelManifest): Terra3DAsset {
  const entry = FORMAT_REGISTRY[m.format];
  if (!entry) throw new ViewerError("unsupported-format", `Unsupported format "${String(m.format)}".`);
  if (entry.kind !== m.kind) {
    throw new ViewerError("unsupported-format", `Manifest declares kind "${m.kind}" but format "${m.format}" is ${formatLabel(m.format)}.`);
  }
  const base = { url: m.url, fileName: m.fileName, transform: m.transform, resources: m.resources, sizeBytes: m.sizeBytes };
  return m.kind === "mesh"
    ? { ...base, kind: "mesh", format: m.format as Extract<Terra3DAsset, { kind: "mesh" }>["format"], mesh: m.mesh }
    : { ...base, kind: "gaussian-splat", format: m.format as Extract<Terra3DAsset, { kind: "gaussian-splat" }>["format"], gaussian: m.gaussian };
}

/** Builds an asset from a bare URL (prototype convenience). Explicit manifests are preferred. */
export function assetFromUrl(url: string, fileName?: string): Terra3DAsset {
  const detected = detectFormat(url, fileName);
  if (!detected) throw new ViewerError("unsupported-format", `Cannot tell the model format of ${fileName ?? "this file"}.`);
  const base = { url, fileName };
  return detected.kind === "mesh"
    ? { ...base, kind: "mesh", format: detected.format as Extract<Terra3DAsset, { kind: "mesh" }>["format"] }
    : { ...base, kind: "gaussian-splat", format: detected.format as Extract<Terra3DAsset, { kind: "gaussian-splat" }>["format"] };
}

export function isManifest(value: Terra3DAsset | TerraModelManifest): value is TerraModelManifest {
  return "modelId" in value;
}

/** Stable identity of an asset for change detection (URL identity; never logged). */
export function assetKey(a: Terra3DAsset): string {
  return `${a.kind}:${a.format}:${a.url}`;
}

const TOKYO_BASE = "/3d%20tokyo";

/**
 * Temporary visual prototype. This is an artist-made mesh, not a Terra capture and not a 3DGS
 * reconstruction — it only demonstrates the viewport, navigation and camera UX.
 */
export const TOKYO_PROTOTYPE: TerraModelManifest = {
  modelId: "prototype-tokyo",
  label: "Tokyo",
  origin: "prototype",
  kind: "mesh",
  format: "fbx",
  url: `${TOKYO_BASE}/source/Export.fbx`,
  fileName: "Export.fbx",
  sizeBytes: 16_398_432,
  upAxis: "y",
  resources: {
    type: "remote",
    baseUrl: `${TOKYO_BASE}/textures/`,
    // The FBX references the author's layered sources; the flattened exports ship instead.
    aliases: { "atlas.psd": "Atlas.jpg", "props_alpha.psd": "props_alpha.png", "lm_final.tga": "LM_Final.jpg" },
  },
  mesh: {
    alphaTest: 0.5,
    animation: true,
    // Object705 is a set of contact-shadow patches just above the ground (verified by isolating it);
    // LM_Final is its blurred-square shadow texture, meant to darken what lies underneath.
    materialOverrides: { "Material #5516": { role: "shadow-decal" } },
  },
  // Rendered from this model in the viewer (home view); used when 3D is not available.
  posterUrl: "/viewroom/tokyo-poster.jpg",
  // Authored after inspecting the model in the viewer (auto-fit remains the fallback). World units.
  defaultCamera: { position: [551, 342, 710], target: [22, -50, -25], fov: 45 },
  tour: [
    { position: [551, 342, 710], target: [22, -50, -25], duration: 0 }, // establishing, front corner
    { position: [260, -140, 430], target: [20, -120, 80], duration: 7 }, // street level: stall, post box, cones
    { position: [-760, 260, 760], target: [0, -50, 0], duration: 7 }, // opposite corner, rail curve
    { position: [-900, 520, -500], target: [0, -40, 0], duration: 6 }, // high rear-left
    { position: [560, 620, -960], target: [40, -60, -40], duration: 6 }, // high rear-right overview, train
  ],
  attribution: "“Little Tokyo” by SavageSeggwaye on Sketchfab, CC BY 4.0 (same 141.8k-triangle model).",
  notes: [
    "Prototype mesh for viewer UX only — not a Terra capture or 3DGS reconstruction.",
    "Lighting is a daylight rig added in the viewer; the original Sketchfab scene lighting is not part of the files.",
  ],
};

const FIXTURE_BASE = "/viewroom/fixtures";
const PLAYCANVAS_NOTE = "From the playcanvas/engine repository examples (MIT). Development fixture only.";

/**
 * Real Gaussian splat files used to prove the Spark path end-to-end. They are not Terra trees.
 * PlayCanvas captures are stored Y-down (COLMAP convention); the 180° X rotation below is the
 * documented per-asset correction, not something applied to every splat.
 */
export const DEV_FIXTURES: TerraModelManifest[] = [
  {
    modelId: "fixture-guitar-ply",
    label: "Guitar",
    origin: "dev-fixture",
    kind: "gaussian-splat",
    format: "ply",
    url: `${FIXTURE_BASE}/guitar.point_cloud.ply`,
    fileName: "guitar.point_cloud.ply",
    sizeBytes: 6_178_601,
    transform: { quaternion: [1, 0, 0, 0] },
    attribution: PLAYCANVAS_NOTE,
    notes: ["Standard 3DGS PLY schema (SH degree 0), decoded from the repository's guitar.compressed.ply."],
  },
  {
    modelId: "fixture-guitar-compressed-ply",
    label: "Guitar (compressed PLY)",
    origin: "dev-fixture",
    kind: "gaussian-splat",
    format: "ply",
    url: `${FIXTURE_BASE}/guitar.compressed.ply`,
    fileName: "guitar.compressed.ply",
    sizeBytes: 1_479_876,
    transform: { quaternion: [1, 0, 0, 0] },
    attribution: PLAYCANVAS_NOTE,
  },
  {
    modelId: "fixture-guitar-spz",
    label: "Guitar (SPZ)",
    origin: "dev-fixture",
    kind: "gaussian-splat",
    format: "spz",
    url: `${FIXTURE_BASE}/guitar.spz`,
    fileName: "guitar.spz",
    sizeBytes: 1_261_039,
    transform: { quaternion: [1, 0, 0, 0] },
    attribution: PLAYCANVAS_NOTE,
    notes: ["Encoded with Spark's writeSpz from the repository's guitar.compressed.ply (gzip SPZ, SH degree 0)."],
  },
];

export const ORIGIN_LABEL: Record<TerraModelManifest["origin"], string> = {
  prototype: "Prototype mesh",
  reconstruction: "3DGS reconstruction",
  "dev-fixture": "Development fixture",
  "local-file": "Local file",
};
