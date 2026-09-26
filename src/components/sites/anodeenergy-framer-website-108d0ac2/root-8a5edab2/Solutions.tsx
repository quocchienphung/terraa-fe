"use client";

import { useEffect, useRef } from "react";
import { SOLUTIONS } from "@/lib/constants";
import { SOLUTIONS_DIM, smoothstep01 } from "@/lib/motion-config";
import { SolutionPanel } from "./SolutionPanel";
import { RevealText } from "../shared/RevealText";

/**
 * "Our Solutions": three sticky rows that stack as you scroll. As row N+1 slides over row N,
 * row N's dim overlay follows 0.42 × smoothstep over row N's height (measured on the reference).
 */
export function Solutions() {
  const listRef = useRef<HTMLDivElement>(null);
  const dims = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(list.children) as HTMLElement[];
    let raf = 0;

    const update = () => {
      raf = 0;
      // Read every position first, then write, so the loop never forces layout.
      const progress = rows.slice(0, -1).map((row, i) => {
        const travel = row.offsetHeight || 1;
        return smoothstep01(1 - rows[i + 1].getBoundingClientRect().top / travel);
      });
      progress.forEach((p, i) => {
        const dim = dims.current[i];
        if (dim) dim.style.opacity = (SOLUTIONS_DIM.max * p).toFixed(3);
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section aria-labelledby="our-solutions" className="flex flex-col items-center gap-[10px] bg-white py-20 tab:py-[120px] desk:py-0">
      <div className="flex w-full max-w-[1800px] flex-col items-center gap-24">
        <div className="flex w-full flex-col items-start gap-10 tab:gap-8">
          <div className="flex w-full items-start gap-8 px-5 tab:px-6 desk:px-8">
            <RevealText
              as="h2"
              id="our-solutions"
              className="w-full max-w-[820px] whitespace-pre-wrap text-[32px] font-normal leading-[1.05] tracking-[-1.28px] text-ink-2 tab:text-[48px] tab:tracking-[-1.92px] desk:text-[72px] desk:tracking-[-2.88px]"
            >
              Our Solutions
            </RevealText>
          </div>

          <div ref={listRef} className="flex w-full flex-col items-start">
            {SOLUTIONS.map((solution, i) => (
              <SolutionPanel
                key={solution.number}
                solution={solution}
                dimRef={(el) => {
                  dims.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
