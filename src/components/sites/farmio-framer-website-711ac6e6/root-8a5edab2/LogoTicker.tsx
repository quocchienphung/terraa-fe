import { TICKER } from "@/lib/motion-config";
import { MARQUEE_LOGOS } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/icons";
import { TickerMotion } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/TickerMotion";

/** Neutral caption: the marks are placeholder logos, so it makes no partnership claim. */
export const TICKER_CAPTION = "Technology for every growing season";

const LOGO_SET_REPEAT = 4;
const TICK_COUNT = 120;

/** One run of the logo set; each track holds two identical runs and wraps by one run width. */
function LogoRun({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div aria-hidden={ariaHidden} className="flex flex-none items-center gap-[90px] pr-[90px] text-farm-ink">
      {Array.from({ length: LOGO_SET_REPEAT }).flatMap((_, r) => MARQUEE_LOGOS.map((Logo, i) => <Logo key={`${r}-${i}`} />))}
    </div>
  );
}

function TickRun() {
  return (
    <div aria-hidden className="flex flex-none items-start gap-[29px] pr-[29px]">
      {Array.from({ length: TICK_COUNT }).map((_, i) => (
        <span key={i} className={i % 5 === 0 ? "h-[18px] w-px flex-none bg-farm-ink/55" : "h-2 w-px flex-none bg-farm-ink/25"} />
      ))}
    </div>
  );
}

/**
 * Retained from the previous site (not part of the Farmio reference): the monochrome logo
 * marquee over a tick ruler with a fixed centre pointer. Motion is unchanged — `TickerMotion`
 * drives both tracks (logos 40 px/s, ruler 56 px/s, scroll-coupled, paused offscreen / hidden
 * tab / reduced motion). Only colour, type and spacing follow the Farmio tokens.
 */
export function LogoTicker() {
  return (
    <section aria-label="Logo ticker" className="overflow-clip bg-white px-5 py-[60px] md:px-0 md:py-20 desk:py-[100px]">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col items-center gap-11 md:gap-14 desk:gap-20">
        <p className="max-w-full rounded-full bg-farm-mist px-4 py-2 text-center fm-p14 text-farm-ink">{TICKER_CAPTION}</p>

        <TickerMotion label="logo ticker" className="relative h-[82px] w-full">
          <div className="h-[22px] overflow-hidden">
            <div data-ticker-track data-ticker-speed={TICKER.logoPxPerSecond} className="flex w-max will-change-transform">
              <LogoRun />
              <LogoRun ariaHidden />
            </div>
          </div>

          <div className="relative mt-7 h-8 overflow-hidden">
            <div data-ticker-track data-ticker-speed={TICKER.rulerPxPerSecond} className="flex w-max will-change-transform">
              <TickRun />
              <TickRun />
            </div>
            <span aria-hidden className="absolute left-1/2 top-0 -ml-px h-[22px] w-[2px] bg-farm-ink" />
            <span
              aria-hidden
              className="absolute left-1/2 top-6 -ml-[5px] h-0 w-0 border-b-[6px] border-l-[5px] border-r-[5px] border-b-farm-ink border-l-transparent border-r-transparent"
            />
          </div>
        </TickerMotion>
      </div>
    </section>
  );
}
