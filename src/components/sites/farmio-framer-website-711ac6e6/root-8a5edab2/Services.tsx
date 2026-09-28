"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SERVICES } from "../shared/content";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

const COUNT = SERVICES.items.length;
const pad2 = (n: number) => String(n).padStart(2, "0");
/** Reference: tablet and desktop pin the section; phones get a plain stacked list. */
const PINNED = "(min-width: 768px)";

/**
 * "Our services". From 768px the section is COUNT viewports tall and pins a panel 40px below the
 * viewport top; every viewport of scroll swaps to the next service (background photo + card
 * crossfade, ~0.4s), as the reference's scroll triggers do. Phones render the same items as a
 * list. One DOM serves both layouts.
 */
export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const mql = window.matchMedia(PINNED);
    let raf = 0;
    const measure = () => {
      raf = 0;
      if (!mql.matches) return;
      const vh = window.innerHeight || 1;
      const progress = -section.getBoundingClientRect().top / vh;
      setActive(Math.min(COUNT - 1, Math.max(0, Math.floor(progress))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mql.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mql.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <section id="service" ref={sectionRef} aria-labelledby="services-title" className="relative bg-farm-sand md:h-[500vh]">
      <div className="px-5 pb-[30px] pt-[60px] md:sticky md:top-10 md:h-svh md:overflow-hidden md:px-[30px] md:py-20">
        {/* Background photos (tablet/desktop): stacked, only the active one is opaque. */}
        <div aria-hidden className="absolute inset-0 hidden md:block">
          {SERVICES.items.map((item, i) => (
            <div
              key={item.title}
              className={cn("absolute inset-0 transition-opacity duration-[400ms] ease-farm motion-reduce:transition-none", i === active ? "opacity-100" : "opacity-0")}
            >
              <Image src={item.background.src} alt="" fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/70" />
            </div>
          ))}
        </div>

        <div className="relative mx-auto flex max-w-[1380px] flex-col items-center gap-10 desk:gap-[52px]">
          <div className="flex flex-col items-center gap-4 text-center md:gap-[10px]">
            <SectionTag className="md:text-white">{SERVICES.tag}</SectionTag>
            <WordReveal id="services-title" className="fm-h2 max-w-[625px] text-farm-ink md:text-white">
              {SERVICES.title}
            </WordReveal>
          </div>

          <div className="relative w-full md:w-[585px] desk:w-[655px]">
            <ol className="grid gap-6 md:grid-cols-1 md:grid-rows-1">
              {SERVICES.items.map((item, i) => (
                <li
                  key={item.title}
                  aria-current={i === active ? "step" : undefined}
                  className={cn(
                    "flex flex-col gap-6 rounded-[20px] border border-farm-mist bg-farm-sand px-3 pb-6 pt-3 md:col-start-1 md:row-start-1 md:rounded-xl md:border-0 desk:rounded-[20px]",
                    "md:transition-opacity md:duration-[400ms] md:ease-farm motion-reduce:transition-none",
                    i === active ? "md:opacity-100" : "md:pointer-events-none md:opacity-0",
                  )}
                >
                  <div className="relative h-[210px] overflow-hidden rounded-xl md:h-[330px] desk:h-[339px] desk:rounded-[20px]">
                    <Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 1200px) 631px, (min-width: 768px) 561px, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-col items-center gap-[14px] text-center md:gap-4 desk:gap-5">
                    <h3 className="fm-h4 text-farm-ink">{item.title}</h3>
                    <p className={cn("fm-h6 text-balance text-farm-body", i < 2 ? "desk:max-w-[400px]" : "desk:max-w-[552px]")}>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            {/* Progress + hint: centred below the card on tablet, beside its bottom edge on desktop. */}
            <div
              aria-hidden
              className="mt-[30px] hidden flex-col items-center gap-[10px] text-white md:flex desk:absolute desk:bottom-0 desk:left-[calc(100%+20px)] desk:mt-0 desk:items-start desk:gap-4"
            >
              <p className="fm-h6 whitespace-nowrap">
                {pad2(active + 1)}/<span className="text-white/50">{pad2(COUNT)}</span>
              </p>
              <p className="fm-h6 whitespace-nowrap">{SERVICES.hint}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
