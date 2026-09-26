import { CTA as CTA_CONTENT } from "@/lib/constants";
import { ArrowCta } from "../shared/ArrowCta";

/**
 * Builds the HUD tick ring the reference draws procedurally: `count` radial ticks around a
 * circle, with a longer tick every `majorEvery`.
 */
function tickRing(size: number, count: number, majorEvery: number, minor: [number, number], major: [number, number], alpha: number) {
  const c = size / 2;
  const lines: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const [r1, r2] = i % majorEvery === 0 ? major : minor;
    const x1 = (c + Math.cos(a) * r1).toFixed(1);
    const y1 = (c + Math.sin(a) * r1).toFixed(1);
    const x2 = (c + Math.cos(a) * r2).toFixed(1);
    const y2 = (c + Math.sin(a) * r2).toFixed(1);
    lines.push(`<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'/>`);
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><g stroke='rgba(255,255,255,${alpha})' stroke-width='1'>${lines.join("")}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const RING_A = tickRing(640, 96, 8, [302, 315], [300, 318], 0.22);
const RING_B = tickRing(860, 64, 8, [422, 426], [419, 428], 0.16);

export function CTA() {
  return (
    <section
      data-nav-theme="dark"
      aria-labelledby="ready-to-build"
      className="relative flex min-h-[60vh] flex-col items-center justify-center gap-[10px] overflow-hidden bg-ink-2 py-32"
    >
      <div className="relative z-[1] flex w-full flex-col items-center justify-center gap-8 overflow-hidden px-8">
        <div className="flex w-full max-w-[650px] flex-col items-center justify-center gap-4 overflow-hidden">
          <h3
            id="ready-to-build"
            className="text-center text-[32px] font-normal leading-[1.15] tracking-[-1.6px] text-white tab:text-[40px] tab:tracking-[-2px] desk:text-[48px] desk:tracking-[-2.4px]"
          >
            {CTA_CONTENT.title}
          </h3>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-[10px]">
          <div className="w-[200px]">
            <ArrowCta href={CTA_CONTENT.button.href} label={CTA_CONTENT.button.label} variant="brand" sweep="white" />
          </div>
        </div>
      </div>

      {/* HUD decoration — all rings share a center at (50%, 270px) */}
      <div aria-hidden className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[270px] size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08]" />
        <div className="absolute left-1/2 top-[270px] size-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
        <div className="absolute left-1/2 top-[270px] size-[1500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.043]" />
        <div
          className="motion-safe-anim absolute left-1/2 top-[270px] size-[884px] animate-[hud-spin_80s_linear_infinite] bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: RING_A }}
        />
        <div
          className="motion-safe-anim absolute left-1/2 top-[270px] size-[1103px] animate-[hud-spin-r_130s_linear_infinite] bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: RING_B }}
        />
        <div className="absolute left-[16%] top-[14%] size-[14px] border-l border-t border-white/[0.18]" />
        <div className="absolute right-[16%] top-[14%] size-[14px] border-r border-t border-white/[0.18]" />
        <div className="absolute bottom-[14%] left-[16%] size-[14px] border-b border-l border-white/[0.18]" />
        <div className="absolute bottom-[14%] right-[16%] size-[14px] border-b border-r border-white/[0.18]" />
        <div className="ruler-y absolute inset-y-0 left-0 w-2" />
        <div className="ruler-y absolute inset-y-0 right-0 w-2" />
      </div>
    </section>
  );
}
