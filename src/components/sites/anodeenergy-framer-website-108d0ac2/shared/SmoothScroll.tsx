"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scrolling, matching the reference site (`<html class="lenis">`).
 * Disabled automatically when the visitor prefers reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true });
    return () => lenis.destroy();
  }, []);

  return null;
}
