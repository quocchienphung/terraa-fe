import { WHAT_WE_DO } from "@/lib/constants";
import { ArrowCta } from "../shared/ArrowCta";
import { SectionLabel } from "../shared/SectionLabel";
import { RevealText } from "../shared/RevealText";

export function WhatWeDo() {
  return (
    <section aria-labelledby="what-we-do" className="flex flex-col items-center gap-[10px] overflow-clip bg-white px-4 pb-20 pt-8 tab:px-6 tab:pb-24 desk:px-8 desk:pb-40">
      <div className="flex w-full max-w-[1800px] flex-col items-center gap-16 desk:gap-24">
        <div className="flex w-full flex-col items-start gap-12 desk:gap-20">
          <div className="flex w-full flex-col items-start gap-6 overflow-clip desk:w-[80%]">
            <SectionLabel>{WHAT_WE_DO.label}</SectionLabel>
            <RevealText
              as="h3"
              id="what-we-do"
              className="whitespace-pre-wrap text-[32px] font-normal leading-[1.15] tracking-[-1.6px] text-ink-2 tab:text-[40px] tab:tracking-[-2px] desk:text-[48px] desk:tracking-[-2.4px]"
            >
              {WHAT_WE_DO.statement}
            </RevealText>
          </div>

          <div className="flex w-full flex-col items-start justify-end gap-8 desk:flex-row desk:gap-12">
            <div className="flex w-full flex-col items-start gap-8 desk:w-1/2">
              <div className="flex w-full flex-col items-start gap-2 tab:flex-row tab:gap-4">
                {WHAT_WE_DO.ctas.map((cta) => (
                  <div key={cta.label} className="w-full tab:flex-1">
                    <ArrowCta href={cta.href} label={cta.label} variant="panel" sweep={cta.sweep} />
                  </div>
                ))}
              </div>
              <p className="w-full whitespace-pre-wrap text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-muted-1 desk:w-1/2">
                {WHAT_WE_DO.supporting}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
