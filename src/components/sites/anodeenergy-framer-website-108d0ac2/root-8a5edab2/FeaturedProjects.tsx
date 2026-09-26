"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECTS, PROJECTS_SECTION } from "@/lib/constants";
import { prefersReducedMotion } from "@/lib/animations";
import { CarouselButton } from "../shared/CarouselButton";
import { SectionLabel } from "../shared/SectionLabel";
import { ProjectCard } from "./ProjectCard";
import { RevealText } from "../shared/RevealText";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * "Featured Projects": a scroll-snapping horizontal list. Auto-advances every ~4.5s,
 * wraps after the last slide, and the prev/next buttons step through it.
 */
export function FeaturedProjects() {
  const listRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const timer = useRef<number | null>(null);

  const step = useCallback(() => {
    const list = listRef.current;
    if (!list) return 0;
    const first = list.children[0] as HTMLElement | undefined;
    return first ? first.offsetWidth + 8 : 0;
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const list = listRef.current;
      if (!list) return;
      const n = PROJECTS.length;
      const target = ((i % n) + n) % n;
      list.scrollTo({ left: target * step(), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    },
    [step],
  );

  const restart = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      const list = listRef.current;
      if (!list) return;
      const current = Math.round(list.scrollLeft / step());
      goTo(current + 1);
    }, PROJECTS_SECTION.cycleMs);
  }, [goTo, step]);

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [restart]);

  // Keep the counter in sync with whatever the list is showing (wheel, drag, buttons, timer).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIndex(Math.round(list.scrollLeft / step())));
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      list.removeEventListener("scroll", onScroll);
    };
  }, [step]);

  const nav = (delta: number) => {
    goTo(index + delta);
    restart();
  };

  return (
    <section
      aria-labelledby="featured-projects"
      className="flex flex-col items-center gap-2 overflow-clip bg-white py-20 pl-0 pr-4 tab:px-6 tab:py-[120px] desk:pb-[100px] desk:pl-2 desk:pr-0 desk:pt-[180px]"
    >
      <div className="flex w-full max-w-[1800px] flex-col items-center gap-12 tab:gap-24">
        <div className="flex w-full flex-col items-start gap-12 pl-2 tab:pl-0 desk:gap-8">
          <div className="flex w-full items-end gap-8 tab:px-6">
            <div className="flex flex-1 flex-col items-start gap-6 pl-2 tab:pl-0">
              <SectionLabel>{PROJECTS_SECTION.label}</SectionLabel>
              <RevealText
                as="h2"
                id="featured-projects"
                className="whitespace-pre-wrap text-[32px] font-normal leading-[1.05] tracking-[-1.28px] text-ink-2 tab:text-[48px] tab:tracking-[-1.92px] desk:text-[72px] desk:tracking-[-2.88px]"
              >
                {PROJECTS_SECTION.title}
              </RevealText>
            </div>

            <div className="w-28 flex-none">
              <div aria-live="polite" className="mb-4 text-right font-pt text-[10px] leading-4 tracking-[-0.2px] text-muted-1">
                {pad2(index + 1)}/{pad2(PROJECTS.length)}
              </div>
              <div className="flex justify-end gap-2">
                <CarouselButton direction="prev" label="Previous project" onClick={() => nav(-1)} />
                <CarouselButton direction="next" label="Next project" onClick={() => nav(1)} />
              </div>
            </div>
          </div>

          <div ref={listRef} className="no-scrollbar flex w-full snap-x snap-mandatory items-start gap-2 overflow-x-auto overflow-y-hidden">
            {PROJECTS.map((p, i) => (
              <ProjectCard key={p.slug} project={p} preload={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
