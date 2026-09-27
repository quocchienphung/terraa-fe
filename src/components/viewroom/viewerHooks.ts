"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/** Live media query; `fallback` is used during SSR/hydration. */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

/** Live `devicePixelRatio` (changes with browser zoom or moving between displays). */
export function useDeviceRatio(): number {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      mql.addEventListener("change", cb);
      window.addEventListener("resize", cb);
      return () => {
        mql.removeEventListener("change", cb);
        window.removeEventListener("resize", cb);
      };
    },
    () => window.devicePixelRatio || 1,
    () => 1,
  );
}

/** `null` until probed on the client. Frees the probe context immediately. */
export function useWebGL2Support(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let supported = false;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("webgl2");
      supported = !!ctx;
      ctx?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      supported = false;
    }
    // Probe once after mount; the result never changes during the session.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOk(supported);
  }, []);
  return ok;
}

type WebkitDocument = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> };
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

/**
 * Element fullscreen with a graceful in-page "expanded" mode where the Fullscreen API is missing
 * (e.g. iPhone Safari). State follows `fullscreenchange`, so Esc / browser UI stay in sync.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [native, setNative] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const doc = document as WebkitDocument;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability probe after mount
    setSupported(!!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled));
    const onChange = () => setNative((doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null) === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [ref]);

  const toggle = useCallback(async () => {
    const doc = document as WebkitDocument;
    const el = ref.current as WebkitElement | null;
    if (!el) return;
    if (!supported) {
      setExpanded((v) => !v);
      return;
    }
    try {
      if ((doc.fullscreenElement ?? doc.webkitFullscreenElement) === el) {
        await (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else {
        await el.webkitRequestFullscreen?.();
      }
    } catch {
      // Denied (no gesture, iframe policy…): fall back to the in-page expanded layout.
      setExpanded((v) => !v);
    }
  }, [ref, supported]);

  return { active: native || expanded, native, expanded, supported, toggle, exitExpanded: () => setExpanded(false) };
}
