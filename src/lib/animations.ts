/** Easings measured on the reference site's code components. */
export const EASE_CTA = "cubic-bezier(0.22, 0.61, 0.24, 1)";
export const EASE_NAV = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Testimonial line-mask transition timings (ms). */
export const QUOTE_OUT_MS = 700;
export const QUOTE_IN_MS = 750;
export const QUOTE_STAGGER_MS = 60;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
