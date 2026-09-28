"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import type { MapLocation } from "@/types/anode";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { LOAD_ROOT_MARGIN, ORIENTATION } from "./earth-config";
import type { FocusRequest, ProjectedMarker } from "./EarthCanvas";

export type GlobeStage = "poster" | "loading" | "ready" | "failed";

/** Desktop card placement next to the selected pin. */
export interface CardLayout {
  /** Gap from the pin to the card. */
  offsetX: number;
  offsetY: number;
  /** Minimum distance to the frame edges. */
  margin: number;
  /** Space kept free at the bottom (legend / controls bar). */
  bottomReserve: number;
  /** Below this width the card stays docked instead of following the pin. */
  dockBelow: number;
}

export const DEFAULT_CARD_LAYOUT: CardLayout = { offsetX: 26, offsetY: 10, margin: 12, bottomReserve: 64, dockBelow: 768 };

/**
 * Presentation-independent state of the Earth section: lazy mount, selection, hold/pause and the
 * per-frame pin/card DOM writes. Used by every globe section so the interaction contract lives in
 * one place; the section only supplies markup (refs from here) and styling.
 *
 * - `stage`: poster (SSR) → loading (section near the viewport) → ready | failed.
 * - `userPaused`: the explicit Pause button. `held`: pointer or keyboard focus on a pin, card or
 *   control, released `ORIENTATION.resumeDelayMs` after it leaves.
 * - Pins and the card are positioned by writing transforms directly in `onProject` (no React
 *   state per frame).
 */
export function useGlobeController(locations: MapLocation[], initialIndex: number, card: CardLayout = DEFAULT_CARD_LAYOUT) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(initialIndex);
  const [stage, setStage] = useState<GlobeStage>("poster");
  const [userPaused, setUserPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [focus, setFocus] = useState<FocusRequest | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pinShown = useRef<boolean[]>([]);
  const lastPoints = useRef<(ProjectedMarker | null)[]>([]);
  const activeRef = useRef(active);
  const layout = useRef({ cardW: 300, cardH: 185, titleBottom: 220 });
  const holdTimer = useRef<number | null>(null);
  const focusSeq = useRef(0);
  const cardLayout = useRef(card);

  // Mount the WebGL scene only when the section is near the viewport.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setStage((s) => (s === "poster" ? "loading" : s));
        io.disconnect();
      },
      { rootMargin: LOAD_ROOT_MARGIN },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // Card size and the title's bottom edge, measured off the animation path.
  useEffect(() => {
    const cardEl = cardRef.current;
    const title = titleRef.current;
    const section = sectionRef.current;
    if (!cardEl || !title || !section) return;
    const measure = () => {
      layout.current = {
        cardW: cardEl.offsetWidth,
        cardH: cardEl.offsetHeight,
        titleBottom: title.offsetTop + title.offsetHeight,
      };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cardEl);
    ro.observe(title);
    ro.observe(section);
    return () => ro.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
    },
    [],
  );

  const placeCard = useCallback((points: (ProjectedMarker | null)[], w: number, h: number) => {
    const el = cardRef.current;
    if (!el) return;
    const c = cardLayout.current;
    if (w < c.dockBelow) {
      el.style.transform = "";
      el.dataset.hidden = "false";
      return;
    }
    const p = points[activeRef.current];
    if (!p || p.opacity < 0.35) {
      el.dataset.hidden = "true";
      return;
    }
    const { cardW, cardH, titleBottom } = layout.current;
    const x = Math.min(Math.max(p.x + c.offsetX, c.margin), w - cardW - c.margin);
    const y = Math.min(Math.max(p.y - cardH + c.offsetY, titleBottom + 16), h - cardH - c.bottomReserve);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.dataset.hidden = "false";
  }, []);

  /** Called by the canvas for every rendered frame: writes pin/card transforms directly. */
  const onProject = useCallback(
    (points: (ProjectedMarker | null)[], w: number, h: number) => {
      lastPoints.current = points;
      points.forEach((p, i) => {
        const el = pinRefs.current[i];
        if (!el) return;
        const show = p !== null && p.opacity > 0.01;
        if (show !== pinShown.current[i]) {
          pinShown.current[i] = show;
          el.style.visibility = show ? "visible" : "hidden";
          if (show) {
            el.removeAttribute("tabindex");
            el.removeAttribute("aria-hidden");
          } else {
            el.tabIndex = -1;
            el.setAttribute("aria-hidden", "true");
            if (document.activeElement === el) el.blur();
          }
        }
        if (show && p) {
          el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
          el.style.opacity = p.opacity.toFixed(3);
        }
      });
      placeCard(points, w, h);
    },
    [placeCard],
  );

  // Back to the docked card when the globe is not (or no longer) available.
  useEffect(() => {
    if (stage === "ready") return;
    const el = cardRef.current;
    if (el) {
      el.style.transform = "";
      el.dataset.hidden = "false";
    }
  }, [stage]);

  const engageHold = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHeld(true);
  }, []);

  const releaseHold = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => setHeld(false), ORIENTATION.resumeDelayMs);
  }, []);

  // Keyboard focus holds the rotation; a mouse click leaves focus on the button, so only
  // `:focus-visible` counts — otherwise the globe would stay held after every click.
  const holdHandlers = {
    onPointerEnter: engageHold,
    onPointerLeave: releaseHold,
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (e.target.matches(":focus-visible")) engageHold();
    },
    onBlur: releaseHold,
  };

  const select = (i: number, fromPin = false) => {
    const n = locations.length;
    const target = ((i % n) + n) % n;
    setActive(target);
    activeRef.current = target;
    const onScreen = (lastPoints.current[target]?.opacity ?? 0) > 0.5;
    if (!fromPin && !onScreen && locations[target]?.geo) {
      focusSeq.current += 1;
      setFocus({ index: target, seq: focusSeq.current });
    }
    if (stage === "ready") placeCard(lastPoints.current, sectionRef.current?.clientWidth ?? 0, sectionRef.current?.clientHeight ?? 0);
  };

  return {
    reduced,
    active,
    stage,
    ready: stage === "ready",
    userPaused,
    setUserPaused,
    held,
    focus,
    setStage,
    select,
    onProject,
    holdHandlers,
    refs: { sectionRef, titleRef, cardRef, pinRefs },
  };
}
