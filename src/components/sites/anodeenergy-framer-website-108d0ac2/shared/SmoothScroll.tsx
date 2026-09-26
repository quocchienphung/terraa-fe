"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { watchReducedMotion } from "@/hooks/use-reduced-motion";

let current: Lenis | null = null;
let stopRequests = 0;

/** Pause smooth scrolling (menu open). Balanced by `resumeSmoothScroll`. */
export function pauseSmoothScroll() {
  stopRequests += 1;
  current?.stop();
}

export function resumeSmoothScroll() {
  stopRequests = Math.max(0, stopRequests - 1);
  if (stopRequests === 0) current?.start();
}

/**
 * Lenis smooth scrolling, matching the reference site (`<html class="lenis">`).
 * Lenis is the only scroll driver (autoRaf). It is torn down while the visitor prefers
 * reduced motion and recreated if that preference is switched off mid-session.
 */
export function SmoothScroll() {
  useEffect(() => {
    const destroy = () => {
      current?.destroy();
      current = null;
    };
    const stopWatching = watchReducedMotion((reduced) => {
      if (reduced) {
        destroy();
        return;
      }
      if (current) return;
      current = new Lenis({ autoRaf: true });
      if (stopRequests > 0) current.stop();
    });
    return () => {
      stopWatching();
      destroy();
    };
  }, []);

  return null;
}
