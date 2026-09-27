import type { AssetFormat, AssetKind } from "./viewerTypes";

/**
 * Format registry. Server manifests declare `kind` + `format` explicitly; extension detection is
 * only the fallback for local files and the prototype. Note `.ply` maps to the Gaussian branch
 * here, but the Gaussian adapter still validates the header before trusting it (see plyHeader.ts).
 */
export const FORMAT_REGISTRY: Record<AssetFormat, { kind: AssetKind; label: string }> = {
  fbx: { kind: "mesh", label: "FBX mesh" },
  glb: { kind: "mesh", label: "glTF binary mesh" },
  gltf: { kind: "mesh", label: "glTF mesh" },
  obj: { kind: "mesh", label: "OBJ mesh" },
  ply: { kind: "gaussian-splat", label: "Gaussian splat (PLY)" },
  spz: { kind: "gaussian-splat", label: "Gaussian splat (SPZ)" },
  sog: { kind: "gaussian-splat", label: "Gaussian splat (SOG)" },
  splat: { kind: "gaussian-splat", label: "Gaussian splat (.splat)" },
  ksplat: { kind: "gaussian-splat", label: "Gaussian splat (.ksplat)" },
};

/** Sidecar files accepted next to a model in a local selection. */
export const RESOURCE_EXTENSIONS = ["bin", "mtl", "png", "jpg", "jpeg", "webp", "gif", "bmp", "ktx2", "tga"] as const;

export function isAssetFormat(value: string): value is AssetFormat {
  return Object.prototype.hasOwnProperty.call(FORMAT_REGISTRY, value);
}

/** Extension of a path or URL, lower-cased, with query/hash stripped. `""` when there is none. */
export function fileExtension(pathOrUrl: string): string {
  const clean = pathOrUrl.split(/[?#]/, 1)[0];
  const name = clean.slice(Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\")) + 1);
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Detects the format from a file name, falling back to the URL. Blob and data URLs carry no
 * extension, so for those the original file name is the only evidence and is required.
 */
export function detectFormat(url: string, fileName?: string): { kind: AssetKind; format: AssetFormat } | null {
  const opaque = url.startsWith("blob:") || url.startsWith("data:");
  const ext = fileName ? fileExtension(fileName) : opaque ? "" : fileExtension(url);
  if (!isAssetFormat(ext)) return null;
  return { kind: FORMAT_REGISTRY[ext].kind, format: ext };
}

export function formatLabel(format: AssetFormat): string {
  return FORMAT_REGISTRY[format].label;
}
