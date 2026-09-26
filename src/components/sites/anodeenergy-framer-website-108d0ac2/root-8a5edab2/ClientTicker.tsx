import { TICKER_EYEBROW } from "@/lib/constants";
import { MARQUEE_LOGOS } from "../shared/icons";

const LOGO_SET_REPEAT = 4;
const TICK_COUNT = 120;

/** One run of the logo set; the track holds two runs so the -50% keyframe loops seamlessly. */
function LogoRun({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div aria-hidden={ariaHidden} className="flex flex-none items-center gap-[90px] pr-[90px] text-ink-2">
      {Array.from({ length: LOGO_SET_REPEAT }).flatMap((_, r) =>
        MARQUEE_LOGOS.map((Logo, i) => <Logo key={`${r}-${i}`} />),
      )}
    </div>
  );
}

function TickRun() {
  return (
    <div aria-hidden className="flex flex-none items-start gap-[29px] pr-[29px]">
      {Array.from({ length: TICK_COUNT }).map((_, i) => (
        <span key={i} className={i % 5 === 0 ? "h-[18px] w-px flex-none bg-ink-2/55" : "h-2 w-px flex-none bg-ink-2/25"} />
      ))}
    </div>
  );
}

export function ClientTicker() {
  return (
    <section aria-label="Clients" className="flex flex-col items-center gap-[10px] overflow-clip bg-white px-4 py-20 tab:px-0 tab:pb-40">
      <div className="flex w-full max-w-[1800px] flex-col items-center gap-14 tab:gap-24">
        <div className="flex w-full flex-col items-center gap-11 tab:gap-14 desk:gap-20">
          <div className="flex items-center justify-center gap-2 rounded-[861px] bg-panel px-4 py-2">
            <p className="whitespace-pre text-center font-mono text-[10px] uppercase leading-4 text-muted-2">{TICKER_EYEBROW}</p>
          </div>

          <div className="relative h-[82px] w-full">
            <div className="h-[22px] overflow-hidden">
              <div className="motion-safe-anim flex w-max animate-[marquee_55s_linear_infinite]">
                <LogoRun />
                <LogoRun ariaHidden />
              </div>
            </div>

            <div className="relative mt-7 h-8 overflow-hidden">
              <div className="motion-safe-anim flex w-max animate-[marquee_90s_linear_infinite]">
                <TickRun />
                <TickRun />
              </div>
              <span aria-hidden className="absolute left-1/2 top-0 -ml-px h-[22px] w-[2px] bg-ink-2" />
              <span
                aria-hidden
                className="absolute left-1/2 top-6 -ml-[5px] h-0 w-0 border-b-[6px] border-l-[5px] border-r-[5px] border-b-ink-2 border-l-transparent border-r-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
