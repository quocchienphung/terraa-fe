import type { ViewerQuality } from "./viewerTypes";

/**
 * One place for performance knobs. Only settings that really change rendering are listed:
 * canvas DPR range and Spark's LoD splat budget scale (`SparkRenderer.lodSplatScale`).
 */
export interface QualityProfile {
  id: Exclude<ViewerQuality, "auto">;
  dpr: [number, number];
  lodSplatScale: number;
}

export const QUALITY_PROFILES: Record<QualityProfile["id"], QualityProfile> = {
  mobile: { id: "mobile", dpr: [1, 1.5], lodSplatScale: 0.6 },
  balanced: { id: "balanced", dpr: [1, 2], lodSplatScale: 1 },
  high: { id: "high", dpr: [1, 2], lodSplatScale: 1.5 },
};

/**
 * Canvas DPR for an asset kind. The canvas has no MSAA (MSAA is expensive for splats), so meshes get
 * mild supersampling (≥1.5) as anti-aliasing; splats follow the device ratio within the profile.
 */
export function dprFor(kind: "mesh" | "gaussian-splat", profile: QualityProfile, deviceRatio: number): number {
  const [min, max] = profile.dpr;
  const device = deviceRatio > 0 ? deviceRatio : 1;
  return kind === "mesh" ? Math.min(max, Math.max(device, 1.5)) : Math.min(max, Math.max(min, device));
}

/** `auto`: coarse primary pointer (phones/tablets) → mobile, otherwise balanced. Untuned by FPS. */
export function resolveQuality(requested: ViewerQuality, env: { coarsePointer: boolean }): QualityProfile {
  if (requested !== "auto") return QUALITY_PROFILES[requested];
  return env.coarsePointer ? QUALITY_PROFILES.mobile : QUALITY_PROFILES.balanced;
}
