import { Fragment } from "react";
import { ABOUT } from "../shared/content";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

/** 1px ink rule fading to 10% at both ends (reference "Line 16", 3×86). */
function StatDivider() {
  return <span aria-hidden className="hidden h-[86px] w-px flex-none bg-[linear-gradient(180deg,rgba(4,48,59,0.1)_0%,#04303b_50.3%,rgba(4,48,59,0.1)_100%)] md:block" />;
}

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="bg-farm-sand px-5 py-[60px] md:px-[30px] md:py-20 desk:py-[120px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px] desk:gap-20">
        <div className="flex flex-col gap-4 md:gap-5 desk:flex-row desk:justify-between">
          <SectionTag>{ABOUT.tag}</SectionTag>
          <WordReveal id="about-title" className="fm-h2 text-farm-ink desk:w-[636px]">
            {ABOUT.title}
          </WordReveal>
        </div>

        <dl className="flex flex-wrap gap-x-[30px] gap-y-5 md:flex-nowrap md:items-center md:justify-between md:gap-0">
          {ABOUT.stats.map((s, i) => (
            <Fragment key={s.label}>
              {i > 0 ? <StatDivider /> : null}
              <div className="flex flex-col-reverse gap-2">
                <dt className="fm-p16 text-farm-ink">{s.label}</dt>
                <dd className="fm-h3 text-farm-ink">{s.value}</dd>
              </div>
            </Fragment>
          ))}
        </dl>
      </div>
    </section>
  );
}
