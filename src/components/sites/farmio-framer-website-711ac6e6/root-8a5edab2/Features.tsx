import Image from "next/image";
import { FEATURES } from "../shared/content";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

export function Features() {
  return (
    <section id="feature-section" aria-labelledby="features-title" className="bg-farm-sand px-5 pb-[60px] pt-[30px] md:px-[30px] md:py-20 desk:py-[120px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px] desk:flex-row desk:gap-12">
        <div className="flex flex-col gap-10 md:gap-[46px] desk:w-[599px] desk:flex-none desk:gap-[60px]">
          <div className="flex flex-col gap-4 md:max-w-[550px] md:gap-5 desk:max-w-[768px]">
            <SectionTag>{FEATURES.tag}</SectionTag>
            <WordReveal id="features-title" className="fm-h2 text-farm-ink">
              {FEATURES.title}
            </WordReveal>
            <p className="fm-p18 text-balance text-farm-body">{FEATURES.body}</p>
          </div>

          <ul className="grid gap-6 md:grid-cols-2">
            {FEATURES.stats.map((s) => (
              <li key={s.value} className="flex flex-col gap-5">
                <span className="flex size-[60px] items-center justify-center rounded-full bg-farm-lime">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny inline SVG icon from the reference */}
                  <img src={s.icon} alt="" width={28} height={30} className="h-[30px] w-7" />
                </span>
                <div className="flex flex-col gap-5">
                  <p className="fm-h4 text-farm-ink">{s.value}</p>
                  <p className="fm-p16 text-balance text-farm-body">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative h-[279px] overflow-hidden rounded-[20px] md:h-[625px] desk:h-auto desk:flex-1">
          <Image src={FEATURES.image.src} alt={FEATURES.image.alt} fill sizes="(min-width: 1200px) 673px, 100vw" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
