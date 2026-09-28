import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SolutionCard } from "@/types/farmio";
import { CONTACT_HREF, SOLUTIONS } from "../shared/content";
import { PillButton } from "../shared/PillButton";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

/** Desktop heights step up 363 → 445 → 712 and share a bottom edge; tablet 393; phone 274/305. */
const HEIGHTS = ["desk:h-[363px]", "desk:h-[445px]", "desk:h-[712px]"];
const PHONE_HEIGHTS = ["h-[274px]", "h-[274px]", "h-[305px]"];

function Card({ card, index }: { card: SolutionCard; index: number }) {
  return (
    <article className={cn("relative isolate flex flex-col justify-between overflow-hidden rounded-[20px] p-5 md:h-[393px] md:p-6", PHONE_HEIGHTS[index], HEIGHTS[index])}>
      <Image src={card.image.src} alt={card.image.alt} fill sizes="(min-width: 1200px) 424px, (min-width: 768px) 50vw, 100vw" className="-z-10 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#000_17.1%,rgba(4,48,59,0)_100%)]" />
      <div className="flex flex-col gap-5">
        <h3 className="fm-h4 text-white">{card.title}</h3>
        <p className="fm-p16 text-balance text-farm-sand">{card.body}</p>
      </div>
      <ul className="flex flex-wrap gap-x-[13px] gap-y-[10px]">
        {card.tags.map((t) => (
          <li key={t} className="rounded-[20px] bg-farm-sand px-4 py-1 text-center fm-p12 text-farm-ink">
            {t}
          </li>
        ))}
      </ul>
    </article>
  );
}

/**
 * Desktop: the heading block sits top-left over the empty corner of a bottom-aligned card row.
 * Tablet: heading, then a 2-column grid. Phone: stacked.
 */
export function Solutions() {
  return (
    <section id="our-solutions" aria-labelledby="solutions-title" className="bg-farm-mist px-5 py-[60px] md:px-[30px] md:py-20 desk:py-[120px]">
      <div className="relative mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px]">
        <div className="flex flex-col items-start gap-6 md:gap-[30px] desk:absolute desk:left-0 desk:top-0 desk:z-[1] desk:w-[620px]">
          <div className="flex flex-col gap-4 md:gap-5">
            <SectionTag>{SOLUTIONS.tag}</SectionTag>
            <WordReveal id="solutions-title" className="fm-h2 text-farm-ink md:max-w-[485px] desk:max-w-none">
              {SOLUTIONS.title}
            </WordReveal>
          </div>
          <PillButton href={CONTACT_HREF}>{SOLUTIONS.cta}</PillButton>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 desk:flex desk:items-end">
          {SOLUTIONS.cards.map((card, i) => (
            <div key={card.title} className="desk:flex-1">
              <Card card={card} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
