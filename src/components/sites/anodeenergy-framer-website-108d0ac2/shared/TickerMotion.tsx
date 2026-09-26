"use client";

import { useEffect, useRef, useState } from "react";
import { TICKER } from "@/lib/motion-config";
import { wrapOffset } from "@/lib/ticker-math";
import { watchReducedMotion } from "@/hooks/use-reduced-motion";

interface Track {
  el: HTMLElement;
  run: HTMLElement;
  speed: number;
  runWidth: number;
  offset: number;
}

/**
 * Drives every `[data-ticker-track]` inside it from one requestAnimationFrame loop.
 * Each track holds identical runs; its first child is one run, and the track is
 * translated by `offset mod runWidth`, so the loop point is seamless.
 *
 * Speeds are px/s (`data-ticker-speed`). With `TICKER.scrollCoupling` the tracks follow
 * the reference: direction flips with scroll direction and speed grows with scroll speed.
 * The loop only runs while the ticker is near the viewport, the tab is visible, motion is
 * allowed and the visitor has not paused it.
 */
export function TickerMotion({ children, className, label }: { children: React.ReactNode; className?: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    pausedRef.current = paused;
    syncRef.current();
  }, [paused]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const tracks: Track[] = Array.from(root.querySelectorAll<HTMLElement>("[data-ticker-track]")).flatMap((el) => {
      const run = el.firstElementChild as HTMLElement | null;
      return run ? [{ el, run, speed: Number(el.dataset.tickerSpeed) || 0, runWidth: run.offsetWidth, offset: 0 }] : [];
    });

    let raf = 0;
    let last = 0;
    let lastScrollY = window.scrollY;
    let direction = 1; // 1 = leftward, -1 = rightward
    let nearViewport = false;
    let reduced = true;

    const apply = () => {
      for (const t of tracks) t.el.style.transform = `translate3d(${-t.offset}px, 0, 0)`;
    };

    const frame = (now: number) => {
      const dt = Math.min(Math.max(now - last, 0), TICKER.maxDeltaMs) / 1000;
      last = now;
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      let scrollPx = 0;
      if (TICKER.scrollCoupling && dy !== 0) {
        direction = dy > 0 ? -1 : 1;
        scrollPx = Math.min(Math.abs(dy), 400);
      }
      for (const t of tracks) {
        const distance = t.speed * dt + (t.speed * scrollPx) / TICKER.scrollPxPerSecondForDouble;
        t.offset = wrapOffset(t.offset + direction * distance, t.runWidth);
      }
      apply();
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const shouldRun = nearViewport && !reduced && !pausedRef.current && document.visibilityState === "visible";
      if (shouldRun && !raf) {
        last = performance.now();
        lastScrollY = window.scrollY;
        raf = requestAnimationFrame(frame);
      } else if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    syncRef.current = sync;

    const io = new IntersectionObserver(
      ([entry]) => {
        nearViewport = entry.isIntersecting;
        sync();
      },
      { rootMargin: "100px 0px" },
    );
    io.observe(root);

    // Keep the phase proportional if a run changes width (fonts, breakpoints).
    const ro = new ResizeObserver(() => {
      for (const t of tracks) {
        const w = t.run.offsetWidth;
        if (w > 0 && Math.abs(w - t.runWidth) >= 0.5) {
          t.offset = wrapOffset((t.offset / (t.runWidth || w)) * w, w);
          t.runWidth = w;
        }
      }
      apply();
    });
    tracks.forEach((t) => ro.observe(t.run));

    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);

    const stopWatching = watchReducedMotion((r) => {
      reduced = r;
      if (r) {
        for (const t of tracks) t.offset = 0;
        apply();
      }
      sync();
    });

    return () => {
      stopWatching();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      raf = 0;
      syncRef.current = () => {};
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {children}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:-bottom-10 focus-visible:left-1/2 focus-visible:-translate-x-1/2 focus-visible:whitespace-nowrap focus-visible:rounded-full focus-visible:bg-panel focus-visible:px-4 focus-visible:py-2 focus-visible:font-mono focus-visible:text-[10px] focus-visible:uppercase focus-visible:text-muted-2 focus-visible:outline focus-visible:outline-ink-2"
      >
        {paused ? `Play ${label}` : `Pause ${label}`}
      </button>
    </div>
  );
}
