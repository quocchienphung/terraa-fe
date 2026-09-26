"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MAP, MAP_LOCATIONS } from "@/lib/constants";
import type { MarkerKind } from "@/types/anode";
import { MarkerIcon } from "../shared/icons";
import { SectionLabel } from "../shared/SectionLabel";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * "Where We Operate": a satellite still with nine markers. The active site auto-advances
 * every 5s; clicking a marker selects it and restarts the timer.
 */
export function GlobalFootprint() {
  const [active, setActive] = useState(1);
  const [cardKey, setCardKey] = useState(0);
  const timer = useRef<number | null>(null);

  const restart = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setActive((a) => (a + 1) % MAP_LOCATIONS.length);
      setCardKey((k) => k + 1);
    }, MAP.cycleMs);
  }, []);

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [restart]);

  const select = (i: number) => {
    setActive(i);
    setCardKey((k) => k + 1);
    restart();
  };

  const loc = MAP_LOCATIONS[active];

  return (
    <section
      data-nav-theme="dark"
      aria-labelledby="where-we-operate"
      className="relative flex h-[min(90vh,640px)] w-full flex-col items-center overflow-hidden bg-ink text-white md:h-[min(90vh,800px)]"
    >
      <div className="absolute left-1/2 top-[100px] z-[1] flex w-[1200px] max-w-none -translate-x-1/2 flex-col items-center gap-4 px-6">
        <SectionLabel light>{MAP.label}</SectionLabel>
        <h3
          id="where-we-operate"
          className="w-full max-w-[800px] whitespace-pre-wrap text-center text-[32px] font-normal leading-[1.15] tracking-[-1.6px] tab:text-[40px] tab:tracking-[-2px] desk:text-[48px] desk:tracking-[-2.4px]"
        >
          {MAP.title}
        </h3>
      </div>

      <Image
        src={MAP.image}
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none object-cover brightness-[0.62] contrast-[1.06] saturate-[0.72]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.62)_0%,rgba(10,10,10,0.12)_30%,rgba(10,10,10,0)_48%),linear-gradient(0deg,rgba(10,10,10,0.55)_0%,rgba(10,10,10,0)_22%)]"
      />

      {MAP_LOCATIONS.map((m, i) => {
        const on = i === active;
        return (
          <button
            key={m.name}
            type="button"
            aria-label={m.name}
            aria-pressed={on}
            onClick={() => select(i)}
            style={{ left: `${m.left}%`, top: `${m.top}%` }}
            className={cn(
              "absolute z-[2] inline-flex size-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-none",
              on ? "text-brand" : "text-white/[0.92]",
            )}
          >
            {on ? (
              <>
                <span aria-hidden className="motion-safe-anim absolute inset-[5px] animate-[marker-pulse_2.4s_cubic-bezier(0.22,0.61,0.24,1)_infinite] rounded-full border border-brand" />
                <span aria-hidden className="absolute inset-[5px] rounded-full border border-brand opacity-55" />
              </>
            ) : null}
            <MarkerIcon kind={m.kind} size={on ? 17 : 14} />
          </button>
        );
      })}

      <div
        key={cardKey}
        role="status"
        aria-live="polite"
        style={{ "--mx": `${loc.left}%`, "--my": `${loc.top}%` } as React.CSSProperties}
        className="motion-safe-anim glass absolute inset-x-3 bottom-11 z-[5] animate-[rise-in_0.35s_cubic-bezier(0.22,0.61,0.24,1)_both] rounded-xl border border-white/[0.08] px-4 pb-4 pt-[15px] md:inset-auto md:left-[min(var(--mx),calc(100%-344px))] md:top-[max(var(--my),330px)] md:w-[300px] md:translate-x-[26px] md:translate-y-[calc(-100%+10px)] md:px-[22px] md:pb-[22px] md:pt-5"
      >
        <div className="mb-[10px] font-mono text-[9.5px] uppercase leading-[11.4px] tracking-[0.76px] text-[#b5b5b5]">{MAP.kinds[loc.kind]}</div>
        <div className="font-system text-[15px] font-medium tracking-[-0.3px] text-white">{loc.name}</div>
        <div className="mt-[2px] font-system text-[13px] text-[#b5b5b5]">{loc.place}</div>
        <div aria-hidden className="my-[14px] h-px bg-white/[0.12]" />
        <div className="font-system text-[12.5px] leading-[18.75px] text-white/[0.72]">{loc.description}</div>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-[3] flex flex-wrap items-end justify-between gap-4 md:inset-x-14 md:bottom-6">
        <div className="flex flex-wrap gap-[18px]">
          {(Object.keys(MAP.kinds) as MarkerKind[]).map((kind) => (
            <span key={kind} className="flex items-center gap-[7px] font-mono text-[9.5px] uppercase tracking-[0.57px] text-white/[0.72]">
              <MarkerIcon kind={kind} size={12} />
              {MAP.kinds[kind]}
            </span>
          ))}
        </div>
        <span className="font-mono text-[9.5px] tracking-[0.57px] text-white/[0.72]">
          {pad2(active + 1)}/{pad2(MAP_LOCATIONS.length)}
        </span>
      </div>
    </section>
  );
}
