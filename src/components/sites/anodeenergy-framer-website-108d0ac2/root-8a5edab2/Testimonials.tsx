"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS, TESTIMONIALS_SECTION } from "@/lib/constants";
import { QUOTE_IN_MS, QUOTE_OUT_MS, QUOTE_STAGGER_MS, prefersReducedMotion } from "@/lib/animations";
import { CarouselButton } from "../shared/CarouselButton";

const pad2 = (n: number) => String(n).padStart(2, "0");
const QUOTE_TYPE =
  "text-[34px] font-normal leading-[1.1] tracking-[-0.03em] text-ink md:text-[44px] desk:text-[48px] desk:leading-[1.08]";

/** Splits `text` into the visual lines it wraps to inside `box` (same width + typography). */
function measureLines(box: HTMLElement, text: string): string[] {
  const probe = document.createElement("div");
  probe.className = box.className;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.inset = "0";
  const words = text.split(" ");
  words.forEach((w, i) => {
    const s = document.createElement("span");
    s.textContent = w + (i < words.length - 1 ? " " : "");
    probe.appendChild(s);
  });
  box.parentElement?.appendChild(probe);
  const lines: string[] = [];
  let lastTop: number | null = null;
  Array.from(probe.children).forEach((c) => {
    const el = c as HTMLElement;
    const top = el.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 2) {
      lines.push(el.textContent ?? "");
      lastTop = top;
    } else {
      lines[lines.length - 1] += el.textContent ?? "";
    }
  });
  probe.remove();
  return lines.map((l) => l.trim());
}

type Phase = "in" | "out" | "enter";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [lines, setLines] = useState<string[]>([TESTIMONIALS[0].quote]);
  const [phase, setPhase] = useState<Phase>("in");
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const busy = useRef(false);

  const remeasure = useCallback((i: number) => {
    const box = boxRef.current;
    if (!box) return;
    setLines(measureLines(box, TESTIMONIALS[i].quote));
  }, []);

  useLayoutEffect(() => {
    remeasure(index);
    const onResize = () => remeasure(index);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => remeasure(index));
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (busy.current) return;
      const n = TESTIMONIALS.length;
      const target = ((next % n) + n) % n;
      if (target === index) return;
      busy.current = true;

      if (prefersReducedMotion()) {
        setIndex(target);
        remeasure(target);
        busy.current = false;
        return;
      }

      setPhase("out");
      const outTotal = QUOTE_OUT_MS + QUOTE_STAGGER_MS * 4;
      window.setTimeout(() => {
        setIndex(target);
        remeasure(target);
        setPhase("enter");
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase("in")));
        window.setTimeout(() => {
          busy.current = false;
        }, QUOTE_IN_MS);
      }, outTotal);
    },
    [index, remeasure],
  );

  const restart = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => goTo(index + 1), TESTIMONIALS_SECTION.cycleMs);
  }, [goTo, index]);

  useEffect(() => {
    restart();
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [restart]);

  const nav = (delta: number) => {
    goTo(index + delta);
    restart();
  };

  const t = TESTIMONIALS[index];
  const authorHidden = phase !== "in";

  return (
    <section aria-label="What our partners say" className="flex flex-col items-center gap-2 bg-white px-4 py-20 lg:px-2 lg:pb-[120px] lg:pt-8 desk:pb-40">
      <div className="flex w-full max-w-[1800px] flex-col items-center gap-12 tab:gap-24">
        <div className="flex w-full flex-col items-start gap-12 tab:gap-20">
          <div className="flex w-full flex-col items-start gap-4 lg:px-6">
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[1fr_1.43fr] lg:grid-cols-[1fr_2fr] lg:gap-12 desk:grid-cols-[1fr_1.5fr]">
              {/* Left column: quote mark + nav (desktop) */}
              <div className="order-2 flex flex-col justify-between lg:order-1">
                <div aria-hidden className="hidden font-quote text-[160px] leading-[0.8] text-brand lg:block">
                  “
                </div>
                <div className="flex items-center gap-2 lg:mt-12">
                  <span aria-live="polite" className="mr-2 font-mono text-[10px] leading-3 text-muted-3">
                    {pad2(index + 1)}/{pad2(TESTIMONIALS.length)}
                  </span>
                  <CarouselButton direction="prev" label="Previous testimonial" onClick={() => nav(-1)} />
                  <CarouselButton direction="next" label="Next testimonial" onClick={() => nav(1)} />
                </div>
              </div>

              {/* Right column: kicker, quote, author */}
              <div className="order-1 flex flex-col gap-8 lg:order-2 lg:gap-12 lg:border-l lg:border-line lg:pl-8">
                <div className="font-mono text-[10px] uppercase leading-3 text-muted-3">{TESTIMONIALS_SECTION.kicker}</div>

                <blockquote className="relative m-0">
                  <div ref={boxRef} className={cn("relative w-full max-w-[20ch]", QUOTE_TYPE)}>
                    {lines.map((line, i) => (
                      <div key={`${index}-${i}`} className="-mb-[0.06em] overflow-hidden pb-[0.06em]">
                        <span
                          className={cn(
                            "block will-change-transform",
                            phase === "in" && "translate-y-0 transition-transform ease-[cubic-bezier(0.22,0.61,0.24,1)]",
                            phase === "out" && "-translate-y-[110%] transition-transform ease-[cubic-bezier(0.22,0.61,0.24,1)]",
                            phase === "enter" && "translate-y-[110%] transition-none",
                          )}
                          style={{
                            transitionDuration: `${phase === "out" ? QUOTE_OUT_MS : QUOTE_IN_MS}ms`,
                            transitionDelay: `${i * QUOTE_STAGGER_MS}ms`,
                          }}
                        >
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>
                </blockquote>

                <div
                  className={cn(
                    "flex flex-col gap-4 transition-[opacity,transform] duration-300 ease-cta lg:mt-auto lg:flex-row lg:gap-8",
                    authorHidden ? "-translate-y-[10px] opacity-0" : "translate-y-0 opacity-100",
                  )}
                >
                  <div className="flex aspect-[1.5] w-[140px] flex-none items-center justify-center overflow-hidden bg-panel-3 p-5 lg:w-[168px] lg:p-7 desk:w-[200px]">
                    <Image src={t.logo.src} alt={t.logo.alt} width={t.logo.width} height={t.logo.height} className="block max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex w-full max-w-[440px] flex-1 flex-col text-[15px] font-medium leading-[19.5px] tracking-[-0.45px] text-ink max-lg:max-w-none">
                    <div className="border-y border-line py-[14px]">{t.name}</div>
                    <div className="border-b border-line py-[14px]">{t.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
