import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/types/anode";
import { DotArrowIcon } from "../shared/icons";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-2 font-fragment text-[11px] leading-[13.2px] tracking-[1.1px] text-white/70">{`[${label}]`}</div>
      <div className="font-inter text-[26px] leading-none tracking-[-0.03em] text-white lg:text-[38px]">{value}</div>
    </div>
  );
}

/** One carousel slide: 1203×687 (aspect 1.75) on desktop, 307×496 (aspect .62) on phones. */
export function ProjectCard({ project, preload = false }: { project: Project; preload?: boolean }) {
  return (
    <Link
      prefetch={false}
      href={`/projects/${project.slug}`}
      className="group flex w-[84%] flex-none snap-start flex-col items-start no-underline focus-visible:outline-none"
    >
      <div className="relative aspect-[0.62] w-full overflow-hidden rounded-[32px] bg-card-dark md:aspect-[1.5] wide:aspect-[1.75]">
        <Image
          src={project.image.src}
          alt={project.title}
          fill
          preload={preload}
          sizes="84vw"
          className="object-cover transition-transform duration-700 ease-cta group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
        />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(10,10,10,0.157)_0%,rgba(10,10,10,0.45)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-ink opacity-0 transition-opacity duration-500 ease-cta group-hover:opacity-[0.18]" />

        <div className="absolute inset-0 flex flex-wrap items-end justify-between gap-6 p-[14px]">
          <div className="flex-[1_1_260px] pb-8 pl-8 lg:pb-[34px] lg:pl-[34px]">
            <div className="mb-4 font-fragment text-[11px] leading-[13.2px] tracking-[1.1px] text-white/70">{`[${project.year}]`}</div>
            <div className="font-inter text-[48px] leading-[52.8px] tracking-[-1.44px] text-white">{project.title}</div>
          </div>

          <div className="glass relative max-w-[560px] flex-[1_1_420px] rounded-[18px] p-6 transition-colors duration-[450ms] ease-cta lg:p-9">
            <span
              aria-hidden
              className="absolute right-8 top-8 -translate-x-[10px] text-white/85 opacity-0 transition-[opacity,transform] duration-[450ms] ease-cta group-hover:translate-x-0 group-hover:opacity-100"
            >
              <DotArrowIcon width={24} height={18} />
            </span>
            <div className="flex flex-wrap gap-8">
              <Metric label="MW" value={project.mw} />
              <Metric label="MWH" value={project.mwh} />
              <Metric label="MONTHS" value={project.months} />
            </div>
            <div className="mt-12 font-inter text-[15px] leading-[21.75px] tracking-[-0.15px] text-white/[0.82]">{project.description}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
