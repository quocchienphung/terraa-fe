import Image from "next/image";
import { TEAM } from "../shared/content";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

export function Team() {
  return (
    <section id="team" aria-labelledby="team-title" className="bg-farm-sand px-5 pb-[60px] pt-[30px] md:px-[30px] md:pb-20 md:pt-10 desk:pb-[120px] desk:pt-[60px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px] desk:gap-[52px]">
        <div className="flex flex-col items-center gap-4 text-center desk:gap-5">
          <SectionTag>{TEAM.tag}</SectionTag>
          <WordReveal id="team-title" className="fm-h2 text-farm-ink">
            {TEAM.title}
          </WordReveal>
        </div>

        <ul className="grid gap-6 md:grid-cols-2 desk:grid-cols-3">
          {TEAM.members.map((m) => (
            <li key={m.name} className="relative isolate flex h-[439px] flex-col justify-end overflow-hidden rounded-[20px] p-[14px] md:h-[429px] desk:h-[532px]">
              <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width: 1200px) 424px, (min-width: 768px) 50vw, 100vw" className="-z-10 object-cover" />
              <div className="flex flex-col gap-4 rounded-lg bg-white p-5">
                <p className="fm-h5 text-farm-ink">{m.name}</p>
                <p className="fm-p16 text-balance text-farm-body opacity-80">{m.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
