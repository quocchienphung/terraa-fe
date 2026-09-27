/**
 * A `.ply` file can be a polygon mesh, a plain point cloud, or Gaussian splat data. Only the last
 * goes to Spark. This reads the ASCII header and classifies it from the declared schema.
 */

export type PlyClass = "gaussian" | "gaussian-compressed" | "mesh" | "point-cloud" | "unknown";

export interface PlyElement {
  name: string;
  count: number;
  properties: string[];
}

export interface PlyInfo {
  format: string;
  elements: PlyElement[];
  classification: PlyClass;
  /** Splat count for Gaussian classes, vertex count otherwise. */
  count: number;
}

/** Bytes needed to be sure the header is complete for any realistic 3DGS PLY. */
export const PLY_HEADER_SCAN_BYTES = 64 * 1024;

export function readPlyHeader(bytes: Uint8Array): string | null {
  const limit = Math.min(bytes.length, PLY_HEADER_SCAN_BYTES);
  let text = "";
  for (let i = 0; i < limit; i++) text += String.fromCharCode(bytes[i]);
  if (!text.startsWith("ply")) return null;
  const end = text.indexOf("end_header");
  return end === -1 ? null : text.slice(0, end);
}

export function parsePlyHeader(header: string): PlyInfo {
  const elements: PlyElement[] = [];
  let format = "";
  for (const raw of header.split(/\r?\n/)) {
    const parts = raw.trim().split(/\s+/);
    if (parts[0] === "format") format = parts[1] ?? "";
    else if (parts[0] === "element") elements.push({ name: parts[1] ?? "", count: Number(parts[2] ?? 0), properties: [] });
    else if (parts[0] === "property" && elements.length > 0) {
      elements[elements.length - 1].properties.push(parts[parts.length - 1]);
    }
  }
  const vertex = elements.find((e) => e.name === "vertex");
  return { format, elements, classification: classify(elements), count: vertex?.count ?? 0 };
}

function classify(elements: PlyElement[]): PlyClass {
  const vertex = elements.find((e) => e.name === "vertex");
  if (!vertex) return "unknown";
  const has = (p: string) => vertex.properties.includes(p);

  // SuperSplat / PlayCanvas compressed PLY: per-chunk quantisation ranges + packed vertices.
  const chunk = elements.find((e) => e.name === "chunk");
  if (chunk && has("packed_position") && has("packed_rotation") && has("packed_scale") && has("packed_color")) {
    return "gaussian-compressed";
  }

  // Standard 3DGS training output: position, opacity, log-scale, rotation and SH colour.
  const gaussian =
    has("x") && has("y") && has("z") &&
    has("opacity") &&
    ["scale_0", "scale_1", "scale_2"].every(has) &&
    ["rot_0", "rot_1", "rot_2", "rot_3"].every(has) &&
    ["f_dc_0", "f_dc_1", "f_dc_2"].every(has);
  if (gaussian) return "gaussian";

  if (elements.some((e) => e.name === "face" && e.count > 0)) return "mesh";
  if (has("x") && has("y") && has("z")) return "point-cloud";
  return "unknown";
}

export function isGaussianPly(info: PlyInfo): boolean {
  return info.classification === "gaussian" || info.classification === "gaussian-compressed";
}
