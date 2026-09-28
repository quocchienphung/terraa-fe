import Image from "next/image";
import { GALLERY } from "../shared/content";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

/** Tile heights inside a 360×751 column (desktop): 320 + 431, 431 + 320, 751, 320 + 431. */
const GROW = [
  ["grow-[320]", "grow-[431]"],
  ["grow-[431]", "grow-[320]"],
  ["grow"],
  ["grow-[320]", "grow-[431]"],
];

/** Full-bleed four-column mosaic; every column keeps the 360:751 proportion at all widths. */
export function Gallery() {
  return (
    <section id="gallery" aria-labelledby="gallery-title" className="bg-farm-sand pb-[30px] pt-[60px] md:pb-10 md:pt-20 desk:pb-[60px] desk:pt-[120px]">
      <div className="flex flex-col gap-10 md:gap-[46px] desk:gap-[52px]">
        <div className="flex flex-col items-center gap-4 px-5 text-center md:px-[30px] desk:gap-5">
          <SectionTag>{GALLERY.tag}</SectionTag>
          <WordReveal id="gallery-title" className="fm-h2 max-w-[625px] text-farm-ink">
            {GALLERY.title}
          </WordReveal>
        </div>

        <div className="grid grid-cols-4">
          {GALLERY.columns.map((col, c) => (
            <div key={c} className="flex aspect-[360/751] flex-col">
              {col.map((im, t) => (
                <div key={im.src} className={`relative min-h-0 basis-0 ${GROW[c][t]}`}>
                  <Image src={im.src} alt={im.alt} fill sizes="25vw" className="object-cover" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
