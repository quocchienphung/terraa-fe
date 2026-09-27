import type { AnimationClip, Object3D } from "three";
import type { AssetKind, AssetStats, AssetWarning, Bounds, LoadProgress, Terra3DAsset } from "../viewerTypes";

/** Result of one load session. The adapter owns every resource under `root` until `dispose()`. */
export interface AssetHandle {
  kind: AssetKind;
  root: Object3D;
  /** Bounds in `root`'s own space (the renderer applies the manifest transform on a wrapper). */
  bounds: Bounds;
  stats: AssetStats;
  warnings: AssetWarning[];
  /** Mesh materials need scene lights; Gaussian splats carry their own radiance. */
  needsLights: boolean;
  animations: AnimationClip[];
  /** Idempotent. */
  dispose: () => void;
}

export interface AdapterContext {
  /** Aborted when the asset changes or the viewer unmounts; adapters stop network work on it. */
  signal: AbortSignal;
  onProgress: (p: LoadProgress) => void;
  /** Human label for messages (file name or model label) — never the URL itself. */
  label: string;
}

export interface AssetAdapter {
  kind: AssetKind;
  load: (asset: Terra3DAsset, ctx: AdapterContext) => Promise<AssetHandle>;
}

export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Load superseded", "AbortError");
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

export function once(fn: () => void): () => void {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    fn();
  };
}
