"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MAP, MAP_LOCATIONS } from "@/lib/constants";
import type { MarkerKind } from "@/types/anode";
import { DotArrowIcon, MarkerIcon } from "../shared/icons";
import { RevealText } from "../shared/RevealText";
import { SectionLabel } from "../shared/SectionLabel";
import { useGlobeController } from "./globe/useGlobeController";

// WebGL island: its own chunk, client-only, mounted when the section nears the viewport.
const EarthCanvas = dynamic(() => import("./globe/EarthCanvas").then((m) => m.EarthCanvas), { ssr: false });

const pad2 = (n: number) => String(n).padStart(2, "0");
const MARKERS = MAP_LOCATIONS.map((l) => l.geo);
const BACKGROUND = "#0a0a0a";

/**
 * "Where We Operate": a WebGL Earth (NASA imagery) with pins at real coordinates.
 * The poster renders from SSR and stays as the fallback. The selected location is kept
 * until the visitor picks another (no auto-advance: the globe itself rotates).
 * Interaction state lives in `useGlobeController` (shared with the Farmio globe section).
 */
export function GlobalFootprint() {
  const {
    reduced,
    active,
    stage,
    ready,
    userPaused,
    setUserPaused,
    held: hold,
    focus,
    setStage,
    select,
    onProject,
    holdHandlers,
    refs: { sectionRef, titleRef, cardRef, pinRefs },
  } = useGlobeController(MAP_LOCATIONS, MAP.initialIndex);

  const loc = MAP_LOCATIONS[active];

  return (
    <section
      ref={sectionRef}
      data-nav-theme="dark"
      aria-labelledby="where-we-operate"
      className="relative flex h-[min(90vh,640px)] w-full flex-col items-center overflow-hidden bg-ink text-white md:h-[min(90vh,800px)]"
    >
      <div ref={titleRef} className="pointer-events-none absolute left-1/2 top-[100px] z-[1] flex w-[1200px] max-w-none -translate-x-1/2 flex-col items-center gap-4 px-6">
        <SectionLabel light>{MAP.label}</SectionLabel>
        <RevealText
          as="h3"
          id="where-we-operate"
          className="w-full max-w-[800px] whitespace-pre-wrap text-center text-[32px] font-normal leading-[1.15] tracking-[-1.6px] tab:text-[40px] tab:tracking-[-2px] desk:text-[48px] desk:tracking-[-2.4px]"
        >
          {MAP.title}
        </RevealText>
      </div>

      <Image
        src={MAP.image}
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none object-cover brightness-[0.62] contrast-[1.06] saturate-[0.72]"
      />

      {stage === "loading" || stage === "ready" ? (
        <EarthCanvas
          markers={MARKERS}
          focus={focus}
          paused={userPaused}
          held={hold}
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
                  "invisible absolute left-0 top-0 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline focus-visible:outline-brand md:size-8",
                  on ? "z-[3] text-brand" : "z-[2] text-white/[0.92]",
                )}
              >
                {on ? (
                  <>
                    <span aria-hidden className="motion-safe-anim absolute inset-[3px] animate-[marker-pulse_2.4s_cubic-bezier(0.22,0.61,0.24,1)_infinite] rounded-full border border-brand" />
                    <span aria-hidden className="absolute inset-[3px] rounded-full border border-brand opacity-55" />
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
        className="absolute inset-x-3 bottom-[76px] z-[5] transition-opacity duration-300 ease-cta data-[hidden=true]:pointer-events-none data-[hidden=true]:opacity-0 md:inset-x-auto md:w-[300px] md:data-[anchor=docked]:bottom-20 md:data-[anchor=docked]:left-14 md:data-[anchor=pin]:bottom-auto md:data-[anchor=pin]:left-0 md:data-[anchor=pin]:top-0"
      >
        <div
          key={active}
          role="status"
          className="motion-safe-anim glass animate-[rise-in_0.35s_cubic-bezier(0.22,0.61,0.24,1)_both] rounded-xl border border-white/[0.08] px-4 pb-4 pt-[15px] md:px-[22px] md:pb-[22px] md:pt-5"
        >
          <div className="mb-[10px] font-mono text-[9.5px] uppercase leading-[11.4px] tracking-[0.76px] text-[#b5b5b5]">{MAP.kinds[loc.kind]}</div>
          <div className="font-system text-[15px] font-medium tracking-[-0.3px] text-white">{loc.name}</div>
          <div className="mt-[2px] font-system text-[13px] text-[#b5b5b5]">{loc.place}</div>
          <div aria-hidden className="my-[14px] h-px bg-white/[0.12]" />
          <div className="font-system text-[12.5px] leading-[18.75px] text-white/[0.72]">{loc.description}</div>
        </div>
      </div>

      {/* The bar spans the full width: only its controls take pointer input, the rest passes through to the globe. */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[3] flex flex-wrap items-end justify-between gap-4 md:inset-x-14 md:bottom-6">
        <div className="flex flex-wrap gap-[18px]">
          {(Object.keys(MAP.kinds) as MarkerKind[]).map((kind) => (
            <span key={kind} className="flex items-center gap-[7px] font-mono text-[9.5px] uppercase tracking-[0.57px] text-white/[0.72]">
              <MarkerIcon kind={kind} size={12} />
              {MAP.kinds[kind]}
            </span>
          ))}
        </div>
        <div {...holdHandlers} className="pointer-events-auto flex items-center gap-2 font-mono text-[9.5px] tracking-[0.57px] text-white/[0.72]">
          <button
            type="button"
            aria-label="Previous location"
            onClick={() => select(active - 1)}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-white/[0.14] bg-transparent p-0 text-white/[0.72] transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-brand"
          >
            <DotArrowIcon flip width={12} height={9} />
          </button>
          <span className="min-w-[38px] text-center">
            {pad2(active + 1)}/{pad2(MAP_LOCATIONS.length)}
          </span>
          <button
            type="button"
            aria-label="Next location"
            onClick={() => select(active + 1)}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-white/[0.14] bg-transparent p-0 text-white/[0.72] transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-brand"
          >
            <DotArrowIcon width={12} height={9} />
          </button>
          {ready && !reduced ? (
            <button
              type="button"
              aria-pressed={userPaused}
              aria-label={userPaused ? "Resume globe rotation" : "Pause globe rotation"}
              onClick={() => setUserPaused((p) => !p)}
              className="ml-1 inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-white/[0.14] bg-transparent px-2 font-mono text-[9.5px] uppercase tracking-[0.57px] text-white/[0.72] transition-colors hover:border-white/40 hover:text-white focus-visible:outline focus-visible:outline-brand"
            >
              {userPaused ? "Play" : "Pause"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
