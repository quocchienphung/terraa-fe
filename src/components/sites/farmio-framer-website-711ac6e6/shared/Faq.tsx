"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { FAQ } from "./content";
import { ChevronIcon } from "./icons";
import { SectionTag } from "./SectionTag";
import { WordReveal } from "./WordReveal";

/**
 * FAQ (reference: single-open accordion, first item open on load, clicking the open item closes
 * it; the panel height animates ~0.5s). Left: questions; right: drone image stretched to the
 * list height (desktop) or a square below it (tablet/phone).
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="faq-section" aria-labelledby={`${baseId}-title`} className="bg-white px-5 py-[60px] md:px-[30px] md:py-20 desk:py-[120px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px] desk:gap-[52px]">
        <div className="flex flex-col items-center gap-4 text-center md:gap-5">
          <SectionTag>{FAQ.tag}</SectionTag>
          <WordReveal id={`${baseId}-title`} className="fm-h2 max-w-[480px] text-farm-ink">
            {FAQ.title}
          </WordReveal>
        </div>

        <div className="flex flex-col gap-6 md:gap-8 desk:flex-row desk:gap-6">
          <ul className="flex flex-col gap-2 desk:w-[calc(50%-12px)] desk:flex-none">
            {FAQ.items.map((item, i) => {
              const isOpen = open === i;
              const panelId = `${baseId}-panel-${i}`;
              const buttonId = `${baseId}-button-${i}`;
              return (
                <li
                  key={item.question}
                  className={cn(
                    // Reference outline: a 1px inset line (no layout size), rgba(0,19,5,0.1).
                    "rounded-xl px-8 ring-1 ring-inset ring-[rgba(0,19,5,0.1)] transition-colors duration-500 ease-farm",
                    isOpen ? "bg-farm-sand" : "bg-white",
                  )}
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full cursor-pointer items-start justify-between gap-6 py-6 text-left fm-h6 text-farm-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-farm-ink"
                    >
                      <span>{item.question}</span>
                      <ChevronIcon className={cn("mt-3 h-[9px] w-4 flex-none transition-transform duration-500 ease-farm", !isOpen && "rotate-180")} />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    inert={!isOpen}
                    className={cn("grid transition-[grid-template-rows] duration-500 ease-farm", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="py-6 shadow-[inset_0_1px_0_rgba(4,48,59,0.15)]">
                        <p className="fm-p16 text-farm-ink">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="relative aspect-square overflow-hidden rounded-[20px] desk:aspect-auto desk:flex-1">
            <Image src={FAQ.image.src} alt={FAQ.image.alt} fill sizes="(min-width: 1200px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
