import { Box3 } from "three";
import { percentileBounds } from "../cameraFit.ts";
import { isGaussianPly, parsePlyHeader, readPlyHeader } from "../plyHeader.ts";
import { ViewerError, type AssetWarning, type GaussianFormat, type Terra3DAsset } from "../viewerTypes.ts";
import { fetchAsset } from "./fetchAsset.ts";
import { once, throwIfAborted, type AssetAdapter, type AssetHandle } from "./adapterTypes.ts";

/** Refuse files that declare more splats than any browser can reasonably hold. */
export const MAX_SPLATS = 30_000_000;
/** Above this many splats, robust (percentile) bounds sampling is skipped for load time. */
const ROBUST_BOUNDS_LIMIT = 4_000_000;

/**
 * Validates the container before handing bytes to Spark so a mesh PLY, a random ZIP or a
 * truncated download fails with a precise message instead of a decoder exception.
 */
export function validateGaussianBytes(format: GaussianFormat, bytes: Uint8Array): { count?: number } {
  const b = (i: number) => bytes[i] ?? -1;
  switch (format) {
    case "ply": {
      const header = readPlyHeader(bytes);
      if (!header) throw new ViewerError("decode-failed", "This file does not have a valid PLY header.");
      const info = parsePlyHeader(header);
      if (!isGaussianPly(info)) {
        const what =
          info.classification === "mesh" ? "a polygon mesh" : info.classification === "point-cloud" ? "a plain point cloud" : "an unrecognised layout";
        throw new ViewerError(
          "not-gaussian-ply",
          `This PLY contains ${what}, not Gaussian splat data.`,
          ["Terra's viewer renders 3D Gaussian Splatting PLY (position, opacity, scale, rotation, colour).", "Export the mesh as GLB/OBJ to view it here."],
        );
      }
      if (info.count > MAX_SPLATS) throw new ViewerError("too-large", `This splat declares ${info.count.toLocaleString("en-US")} Gaussians, above the ${MAX_SPLATS.toLocaleString("en-US")} limit.`);
      return { count: info.count };
    }
    case "spz": {
      // Older SPZ is gzip-wrapped; SPZ v4 starts with the raw "NGSP" magic.
      const gzip = b(0) === 0x1f && b(1) === 0x8b;
      const raw = b(0) === 0x4e && b(1) === 0x47 && b(2) === 0x53 && b(3) === 0x50;
      if (!gzip && !raw) throw new ViewerError("decode-failed", "This file is not a valid SPZ (no gzip or NGSP header).");
      if (raw) {
        // Spark 2.2 only decodes gzip-wrapped SPZ (v2/v3); verified with a real v4 file.
        const version = b(4) | (b(5) << 8);
        throw new ViewerError(
          "unsupported-format",
          `This SPZ uses the newer raw container (version ${version}), which the installed Spark decoder cannot read yet.`,
          ["Re-export as gzip SPZ (v2/v3), or use PLY / SOG."],
        );
      }
      return {};
    }
    case "sog":
      // Bundled SOG is a ZIP holding meta.json + WebP planes. Multi-file SOGS folders are not supported.
      if (b(0) !== 0x50 || b(1) !== 0x4b) {
        throw new ViewerError("decode-failed", "Only bundled .sog files are supported (a single ZIP). Multi-file SOGS folders are not yet supported.");
      }
      return {};
    case "splat":
    case "ksplat":
      return {};
  }
}

export const splatAdapter: AssetAdapter = {
  kind: "gaussian-splat",
  async load(asset: Terra3DAsset, ctx): Promise<AssetHandle> {
    if (asset.kind !== "gaussian-splat") throw new ViewerError("unsupported-format", "Splat adapter received a non-splat asset.");
    const bytes = await fetchAsset(asset.url, ctx);
    throwIfAborted(ctx.signal);
    const { count } = validateGaussianBytes(asset.format, bytes);

    ctx.onProgress({ phase: "decoding" });
    const { SplatMesh, SplatFileType } = await import("@sparkjsdev/spark");
    throwIfAborted(ctx.signal);
    const fileType = {
      ply: SplatFileType.PLY,
      spz: SplatFileType.SPZ,
      splat: SplatFileType.SPLAT,
      ksplat: SplatFileType.KSPLAT,
      sog: SplatFileType.PCSOGSZIP,
    }[asset.format];

    const mesh = new SplatMesh({
      fileBytes: bytes,
      fileType,
      fileName: asset.fileName ?? `asset.${asset.format}`,
      lod: asset.gaussian?.lod ?? false,
    });
    try {
      await mesh.initialized;
      throwIfAborted(ctx.signal);
    } catch (err) {
      mesh.dispose();
      if (ctx.signal.aborted) throw err;
      throw new ViewerError("decode-failed", `The ${asset.format.toUpperCase()} splat could not be decoded. It may be corrupt or an unsupported variant.`, [
        String((err as Error)?.message ?? err),
      ]);
    }

    ctx.onProgress({ phase: "preparing" });
    const splats = mesh.splats?.getNumSplats() ?? mesh.numSplats ?? count ?? 0;
    if (splats === 0) {
      mesh.dispose();
      throw new ViewerError("decode-failed", "The splat file decoded to zero Gaussians.");
    }

    // Camera framing uses robust centre bounds so stray floaters do not dominate the view.
    let bounds = null;
    if (splats <= ROBUST_BOUNDS_LIMIT) {
      const stride = Math.max(1, Math.floor(splats / 200_000));
      const n = Math.ceil(splats / stride);
      const xs = new Float32Array(n);
      const ys = new Float32Array(n);
      const zs = new Float32Array(n);
      let k = 0;
      mesh.forEachSplat((i, center) => {
        if (i % stride !== 0 || k >= n) return;
        xs[k] = center.x;
        ys[k] = center.y;
        zs[k] = center.z;
        k++;
      });
      bounds = percentileBounds(xs.subarray(0, k), ys.subarray(0, k), zs.subarray(0, k), 0.005, 0.995, 0.04);
    }
    if (!bounds) {
      const box: Box3 = mesh.getBoundingBox(true);
      bounds = { min: box.min.toArray(), max: box.max.toArray() };
    }

    const warnings: AssetWarning[] = [];
    if (splats > 3_000_000) {
      warnings.push({ code: "large-asset", message: `${splats.toLocaleString("en-US")} Gaussians — rendering may be slow on mobile devices.` });
    }
    return {
      kind: "gaussian-splat",
      root: mesh,
      bounds,
      stats: { splats },
      warnings,
      needsLights: false,
      animations: [],
      dispose: once(() => mesh.dispose()),
    };
  },
};
