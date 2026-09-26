import Image from "next/image";
import type { Solution } from "@/types/anode";
import { ArrowCta } from "../shared/ArrowCta";
import { CapabilityIcon } from "../shared/icons";

/**
 * One sticky "Product Row": image on the left (stretching to the panel height),
 * info panel on the right. Stacks image-over-panel on phones.
 */
export function SolutionPanel({ solution, dimRef }: { solution: Solution; dimRef?: (el: HTMLDivElement | null) => void }) {
  return (
    <article className="sticky top-0 flex w-full flex-col items-start overflow-hidden tab:flex-row">
      <div className="relative aspect-[1.77273] w-full overflow-clip tab:aspect-auto tab:flex-1 tab:self-stretch">
        <Image
          src={solution.image.src}
          alt=""
          fill
          sizes="(max-width: 809px) 100vw, (max-width: 1199px) 48vw, 65vw"
          className="object-cover object-center"
        />
      </div>

      <div className="flex w-full flex-col items-start gap-8 bg-panel px-6 pb-9 pt-8 tab:w-auto tab:flex-[1_0_48px] tab:gap-12 desk:flex-[0.55_0_0] desk:px-10 desk:py-11">
        <div className="flex flex-col items-start gap-4 tab:gap-2">
          <p className="whitespace-pre-wrap font-mono text-[10px] uppercase leading-4 text-muted-2">{solution.number}</p>
          <h4 className="whitespace-pre-wrap text-[20px] font-normal leading-[1.15] tracking-[-0.8px] text-ink-2 tab:text-[22px] tab:tracking-[-0.88px] desk:text-[32px] desk:tracking-[-1.28px]">
            {solution.title}
          </h4>
        </div>

        <p className="whitespace-pre-wrap text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-ink-2">{solution.intro}</p>

        <div className="flex flex-col items-start gap-4">
          <p className="whitespace-pre-wrap font-mono text-[10px] uppercase leading-4 text-muted-1">CAPABILITIES:</p>
          <ul className="flex list-none flex-col items-start gap-4 p-0">
            {solution.capabilities.map((c) => (
              <li key={c.label} className="flex items-center gap-4">
                <span className="flex size-[34px] flex-none items-center justify-center rounded-md bg-brand-soft">
                  <span className="block size-[18px]">
                    <CapabilityIcon icon={c.icon} />
                  </span>
                </span>
                <p className="whitespace-pre-wrap text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-ink-2">{c.label}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden flex-1 tab:block" />

        <p className="hidden whitespace-pre-wrap text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-ink-2 tab:block">
          {solution.description}
        </p>

        <div className="flex w-[200px] items-center justify-center overflow-clip">
          <ArrowCta href={solution.cta.href} label={solution.cta.label} variant="explore" sweep="ink" />
        </div>
      </div>

      {/* Dim overlay: fades in as the next row covers this one (driven by Solutions.tsx) */}
      <div ref={dimRef} aria-hidden className="pointer-events-none absolute inset-0 z-[5] bg-[#0c0c0c] opacity-0" />
    </article>
  );
}
