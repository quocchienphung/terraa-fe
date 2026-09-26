import Image from "next/image";
import Link from "next/link";
import { NEWS, NEWS_SECTION } from "@/lib/constants";
import type { NewsItem } from "@/types/anode";
import { SectionLabel } from "../shared/SectionLabel";

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link prefetch={false} href={item.href} className="flex flex-col items-start no-underline focus-visible:outline-none">
      <div className="flex w-full flex-col items-start gap-5">
        <div className="relative aspect-[1.33] w-full overflow-clip">
          <Image src={item.image.src} alt="" fill sizes="(max-width: 809px) 100vw, (max-width: 1199px) 50vw, 25vw" className="object-cover" />
        </div>
        <div className="flex w-[90%] flex-col items-start gap-4">
          <p className="whitespace-pre font-mono text-[10px] uppercase leading-4 text-ink-2">{item.date}</p>
          <h5 className="whitespace-pre-wrap text-[16px] font-medium leading-[1.25] tracking-[-0.04em] text-ink-2 tab:text-[17px] desk:text-[18px]">
            {item.title}
          </h5>
        </div>
      </div>
    </Link>
  );
}

export function News() {
  return (
    <section aria-labelledby="news" className="flex flex-col items-center gap-2 overflow-clip bg-white px-2 py-20 tab:pb-[120px] tab:pt-40 desk:pb-40">
      <div className="flex w-full max-w-[1800px] flex-col items-center gap-12 tab:gap-24">
        <div className="flex w-full flex-col items-start gap-12 desk:gap-20">
          <div className="flex w-full flex-col items-start gap-6 pl-3 tab:flex-row tab:gap-8 tab:pl-4 desk:pl-6">
            <div className="flex flex-col items-start gap-4 tab:w-1/2 tab:flex-[0.5_0_0]">
              <SectionLabel>{NEWS_SECTION.label}</SectionLabel>
            </div>
            <div className="flex flex-1 flex-col items-start gap-4">
              <h3
                id="news"
                className="whitespace-pre-wrap text-[32px] font-normal leading-[1.15] tracking-[-1.6px] text-ink-2 tab:text-[40px] tab:tracking-[-2px] desk:text-[48px] desk:tracking-[-2.4px]"
              >
                {NEWS_SECTION.title}
              </h3>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-12 tab:grid-cols-2 tab:gap-2 desk:grid-cols-4">
            {NEWS.map((item) => (
              <NewsCard key={item.href} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
