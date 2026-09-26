"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** Live `prefers-reduced-motion` value; `true` on the server so SSR never assumes motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  );
}

/** Subscribe outside React (animation controllers). Calls `cb` now and on every change. */
export function watchReducedMotion(cb: (reduced: boolean) => void): () => void {
  const mql = window.matchMedia(QUERY);
  const handler = () => cb(mql.matches);
  handler();
  mql.addEventListener("change", handler);
  return () => mql.removeEventListener("change", handler);
}
