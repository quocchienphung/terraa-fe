import { HERO } from "@/lib/constants";
import { SectionLabel } from "../shared/SectionLabel";
import { RevealText } from "../shared/RevealText";

export function Hero() {
  return (
    <section
      data-nav-theme="dark"
      aria-label="Intro"
      className="clip-hero relative z-[1] flex min-h-[130vh] flex-col items-center justify-center gap-8 overflow-hidden px-4 pb-[180px] tab:gap-20 tab:px-8 tab:pb-[100px]"
    >
      {/* Copy block: sits at the bottom of a viewport-tall container */}
      <div className="relative z-[2] flex min-h-[100vh] w-full max-w-[1800px] flex-col items-start justify-end tab:items-center">
        <div className="flex w-full flex-col items-start gap-12 pb-[100px] tab:gap-8 tab:pb-20">
          <div className="flex w-[calc(100%-36px)] flex-col items-start justify-end gap-8 tab:w-[calc(100%-138px)] tab:flex-row tab:justify-end tab:gap-[180px]">
            <div className="flex w-full max-w-[300px] flex-col items-start gap-8 tab:flex-1">
              <h5 className="whitespace-pre-wrap text-[16px] font-medium leading-[20px] tracking-[-0.64px] text-panel tab:text-[18px] tab:leading-[22.5px] tab:tracking-[-0.72px]">
                {HERO.intro}
              </h5>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-6 overflow-clip tab:gap-12">
            <div className="flex min-h-8 w-full flex-wrap items-center justify-between gap-3">
              <SectionLabel light>{HERO.label}</SectionLabel>
            </div>
            <div aria-hidden className="h-px min-h-px w-full bg-white/[0.26]" />
            <div className="flex w-full max-w-[1000px] items-center gap-[10px] pb-[10px]">
              <h1 className="flex-1 text-[48px] font-normal leading-[0.9] tracking-[-1.92px] text-white tab:text-[83px] tab:tracking-[-4.15px] desk:text-[104px] desk:tracking-[-5.2px]">
                {HERO.headline}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Two supporting columns under the headline block */}
      <div className="flex w-full flex-col items-start justify-center gap-12 tab:w-[calc(100%-138px)] tab:max-w-[1238px] tab:items-end">
        <div className="flex w-full flex-col items-start justify-end gap-6 tab:flex-row tab:justify-end tab:gap-[120px]">
          <div className="order-2 flex w-full max-w-[300px] flex-col items-start gap-4 overflow-clip tab:order-1 tab:flex-1">
            <RevealText as="p" className="whitespace-pre-wrap text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-panel">
              {HERO.practice}
            </RevealText>
          </div>
          <div className="order-1 flex w-full max-w-[300px] flex-col items-start gap-3 tab:order-2 tab:flex-1">
            <RevealText as="p" className="whitespace-pre-wrap text-[14px] font-medium leading-[16.8px] tracking-[-0.56px] text-panel">
              {HERO.process}
            </RevealText>
          </div>
        </div>
      </div>

      <div aria-hidden className="clip-hero pointer-events-none absolute inset-0 -z-[1] overflow-hidden bg-[#030405]">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 block h-full w-full object-cover object-center"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-x-0 top-0 h-[180px] bg-gradient-to-b from-black/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[100vh] bg-[radial-gradient(ellipse_48%_30%_at_80%_48%,rgba(10,24,20,0.3),transparent_75%)]" />
        <div className="absolute inset-x-0 top-[26vh] h-[104vh] bg-gradient-to-b from-transparent via-black/35 to-black/45 tab:top-[40vh] tab:h-[90vh]" />
      </div>
    </section>
  );
}
