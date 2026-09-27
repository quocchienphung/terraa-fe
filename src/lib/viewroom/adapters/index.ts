import type { AssetKind, Terra3DAsset } from "../viewerTypes";
import type { AdapterContext, AssetAdapter, AssetHandle } from "./adapterTypes";

/**
 * Adapter registry: the only place that maps an asset kind to a rendering backend. Each adapter
 * module is imported on demand, so a mesh-only session never downloads Spark and vice versa.
 */
const ADAPTERS: Record<AssetKind, () => Promise<AssetAdapter>> = {
  mesh: () => import("./meshAdapter").then((m) => m.meshAdapter),
  "gaussian-splat": () => import("./splatAdapter").then((m) => m.splatAdapter),
};

export async function loadTerraAsset(asset: Terra3DAsset, ctx: AdapterContext): Promise<AssetHandle> {
  const adapter = await ADAPTERS[asset.kind]();
  return adapter.load(asset, ctx);
}

export type { AssetHandle, AdapterContext } from "./adapterTypes";
export { isAbortError } from "./adapterTypes";
