/**
 * Motion parameters for the homepage.
 *
 * `measured` values were sampled frame-by-frame on https://anodeenergy.framer.website/
 * (Chrome 154, 1440×900 / 768×1024 / 390×844, 26 Sep 2026 — see
 * docs/research/anodeenergy-framer-website-108d0ac2/root-8a5edab2/MOTION_AUDIT.md).
 * `proposed` values are design choices for the upgrade and have no reference measurement.
 */

/** Line-mask text reveal (measured). */
export const REVEAL = {
  /** Fit of the sampled translateY curve: 750ms, rms error < 0.002. */
  durationMs: 750,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
  /** Inner line starts at translateY(130%). */
  fromPercent: 130,
  /** Delay between lines that enter the viewport together. */
  staggerMs: 110,
  /** Mask padding that keeps descenders (padding-bottom + negative margin-bottom). */
  maskPadEm: 0.14,
  /** Each line starts once its mask top is this far inside the viewport bottom. */
  triggerInsetPx: 20,
} as const;

/** Client logo / ruler ticker (measured). */
export const TICKER = {
  logoPxPerSecond: 40,
  rulerPxPerSecond: 56,
  /**
   * The reference couples both tracks to page scroll: scrolling down sends them right,
   * scrolling up sends them left, and speed = base × (1 + |scroll px/s| / scrollPxPerSecondForDouble).
   * The direction persists after scrolling stops. Set to false for pure autoplay.
   */
  scrollCoupling: true,
  scrollPxPerSecondForDouble: 80,
  /** Largest frame delta used for integration (tab switches, long frames). */
  maxDeltaMs: 100,
} as const;

/** Sticky Solutions dim (measured): opacity = max × smoothstep(1 − nextTop / coveredRowHeight). */
export const SOLUTIONS_DIM = {
  max: 0.42,
} as const;

export function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
