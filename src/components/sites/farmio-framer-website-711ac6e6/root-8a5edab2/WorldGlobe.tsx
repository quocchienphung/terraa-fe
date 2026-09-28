"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MAP, MAP_LOCATIONS } from "@/lib/constants";
import type { MarkerKind } from "@/types/anode";
import { MarkerIcon } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/icons";
import {
  DEFAULT_CARD_LAYOUT,
  useGlobeController,
} from "@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/useGlobeController";
import { ArrowIcon } from "../shared/icons";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

// WebGL island: its own chunk, client-only, mounted when the section nears the viewport.
const EarthCanvas = dynamic(
  () => import("@/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/EarthCanvas").then((m) => m.EarthCanvas),
  { ssr: false },
);

/** Retained from the previous site; neutral copy because the locations are a demo dataset. */
export const GLOBE_COPY = {
  tag: "Global view",
  title: "A living view of our planet",
  dataNote: "Sample locations · demo data",
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const MARKERS = MAP_LOCATIONS.map((l) => l.geo);
/** Farmio night token; the renderer clears to the same colour so the canvas never shows a seam. */
const BACKGROUND = "#0a0a0a";
/** The legend here carries a data note, so the pinned card keeps more room above the bar. */
const CARD_LAYOUT = { ...DEFAULT_CARD_LAYOUT, bottomReserve: 96 };

const ROUND =
  "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white backdrop-blur-[12px] transition-colors duration-300 ease-farm hover:border-farm-lime hover:bg-farm-lime hover:text-farm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-lime";

/**
 * Retained real-time Earth (day/night, city lights, drifting clouds, relief, atmosphere) with
 * drag / inertia / hover steering, pins, a location card, previous/next and Pause. Engine and
 * interaction contract are unchanged (EarthCanvas + useGlobeController); only the chrome follows
 * the Farmio design system. Placed after Features as a continuation of "global impact".
 */
export function WorldGlobe() {
  const {
    reduced,
    active,
    stage,
    ready,
    userPaused,
    setUserPaused,
    held,
    focus,
    setStage,
    select,
    onProject,
    holdHandlers,
    refs: { sectionRef, titleRef, cardRef, pinRefs },
  } = useGlobeController(MAP_LOCATIONS, MAP.initialIndex, CARD_LAYOUT);

  const loc = MAP_LOCATIONS[active];

  return (
    <section
      id="global-view"
      ref={sectionRef}
      aria-labelledby="global-view-title"
      className="relative flex h-[min(90vh,640px)] w-full flex-col items-center overflow-hidden bg-farm-night text-white md:h-[min(90vh,800px)]"
    >
      <div ref={titleRef} className="pointer-events-none absolute left-1/2 top-[88px] z-[1] flex w-full max-w-[1200px] -translate-x-1/2 flex-col items-center gap-[10px] px-5 md:top-[100px]">
        <SectionTag light>{GLOBE_COPY.tag}</SectionTag>
        <WordReveal id="global-view-title" className="fm-h2 text-center text-white">
          {GLOBE_COPY.title}
        </WordReveal>
      </div>

      <Image src={MAP.image} alt="" fill sizes="100vw" className="pointer-events-none object-cover brightness-[0.62] contrast-[1.06] saturate-[0.72]" />

      {stage === "loading" || stage === "ready" ? (
        <EarthCanvas
          markers={MARKERS}
          focus={focus}
          paused={userPaused}
          held={held}
          reducedMotion={reduced}
          background={BACKGROUND}
          onProject={onProject}
          onReady={() => setStage("ready")}
          onError={() => setStage("failed")}
          className={cn(
            // Display only: drag input goes to EarthCanvas's globe-shaped drag area, so touches
            // elsewhere in the section keep native scrolling.
            "pointer-events-none absolute inset-0 block h-full w-full transition-opacity duration-[350ms] ease-cta",
            ready ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.62)_0%,rgba(10,10,10,0.12)_30%,rgba(10,10,10,0)_48%),linear-gradient(0deg,rgba(10,10,10,0.55)_0%,rgba(10,10,10,0)_22%)]"
      />

      {ready ? (
        <div {...holdHandlers}>
          {MAP_LOCATIONS.map((m, i) => {
            if (!m.geo) return null;
            const on = i === active;
            return (
              <button
                key={m.name}
                ref={(el) => {
                  pinRefs.current[i] = el;
                }}
                type="button"
                aria-label={`${m.name}, ${m.place}`}
                aria-pressed={on}
                aria-hidden
                tabIndex={-1}
                onClick={() => select(i, true)}
                className={cn(
                  "invisible absolute left-0 top-0 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors hover:text-farm-lime focus-visible:text-farm-lime focus-visible:outline focus-visible:outline-farm-lime md:size-8",
                  on ? "z-[3] text-farm-lime" : "z-[2] text-white/[0.92]",
                )}
              >
                {on ? (
                  <>
                    <span aria-hidden className="motion-safe-anim absolute inset-[3px] animate-[marker-pulse_2.4s_cubic-bezier(0.22,0.61,0.24,1)_infinite] rounded-full border border-farm-lime" />
                    <span aria-hidden className="absolute inset-[3px] rounded-full border border-farm-lime opacity-55" />
                  </>
                ) : null}
                <MarkerIcon kind={m.kind} size={on ? 17 : 14} />
              </button>
            );
          })}
        </div>
      ) : null}

      <div
        ref={cardRef}
        {...holdHandlers}
        data-anchor={ready ? "pin" : "docked"}
        className="absolute inset-x-3 bottom-[116px] z-[5] transition-opacity duration-300 ease-farm data-[hidden=true]:pointer-events-none data-[hidden=true]:opacity-0 md:inset-x-auto md:w-[300px] md:data-[anchor=docked]:bottom-24 md:data-[anchor=docked]:left-[30px] md:data-[anchor=pin]:bottom-auto md:data-[anchor=pin]:left-0 md:data-[anchor=pin]:top-0"
      >
        <div key={active} role="status" className="motion-safe-anim animate-[rise-in_0.35s_cubic-bezier(0.22,0.61,0.24,1)_both] rounded-2xl bg-white p-4 text-farm-ink md:p-5">
          <p className="inline-block rounded-[20px] bg-farm-sand px-3 py-0.5 fm-p12 text-farm-ink">{MAP.kinds[loc.kind]}</p>
          <p className="mt-3 fm-h5 text-farm-ink">{loc.name}</p>
          <p className="mt-1 fm-p14 text-farm-body">{loc.place}</p>
          <div aria-hidden className="my-3 h-px bg-farm-ink/10" />
          <p className="fm-p14 text-farm-body">{loc.description}</p>
        </div>
      </div>

      {/* The bar spans the full width: only its controls take pointer input, the rest passes through to the globe. */}
      <div className="pointer-events-none absolute inset-x-5 bottom-4 z-[3] flex flex-wrap items-end justify-between gap-3 md:inset-x-[30px] md:bottom-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-x-[18px] gap-y-1">
            {(Object.keys(MAP.kinds) as MarkerKind[]).map((kind) => (
              <span key={kind} className="flex items-center gap-[7px] fm-p12 text-white/[0.78]">
                <MarkerIcon kind={kind} size={12} />
                {MAP.kinds[kind]}
              </span>
            ))}
          </div>
          <p className="fm-p12 text-white/50">{GLOBE_COPY.dataNote}</p>
        </div>
        <div {...holdHandlers} className="pointer-events-auto flex items-center gap-2 fm-p14 text-white/80">
          <button type="button" aria-label="Previous location" onClick={() => select(active - 1)} className={ROUND}>
            <ArrowIcon className="h-[13px] w-[14px] rotate-180" />
          </button>
          <span className="min-w-[46px] text-center tabular-nums">
            {pad2(active + 1)}/{pad2(MAP_LOCATIONS.length)}
          </span>
          <button type="button" aria-label="Next location" onClick={() => select(active + 1)} className={ROUND}>
            <ArrowIcon className="h-[13px] w-[14px]" />
          </button>
          {ready && !reduced ? (
            <button
              type="button"
              aria-pressed={userPaused}
              aria-label={userPaused ? "Resume globe rotation" : "Pause globe rotation"}
              onClick={() => setUserPaused((p) => !p)}
              className={cn(ROUND, "ml-1 w-auto px-4 fm-p14")}
            >
              {userPaused ? "Play" : "Pause"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
