"use client";

import type { LoadProgress, ViewerStatus } from "@/lib/viewroom/viewerTypes";

function phaseText(status: ViewerStatus, p: LoadProgress | null): string {
  if (status === "loading-viewer") return "Starting 3D viewer";
  if (!p) return "Preparing";
  if (p.phase === "fetching") return "Downloading model";
  if (p.phase === "decoding") return "Decoding model";
  return p.items && p.items.total > 0 ? `Loading textures ${p.items.done}/${p.items.total}` : "Preparing scene";
}

/**
 * Progress card. A percentage is shown only for a trustworthy byte total; otherwise the bar is
 * indeterminate. Only the phase is announced to screen readers, not every byte update.
 */
export function ViewerLoading({ status, progress }: { status: ViewerStatus; progress: LoadProgress | null }) {
  const phase = phaseText(status, progress);
  const determinate = progress?.phase === "fetching" && progress.total !== undefined && progress.loaded !== undefined;
  const pct = determinate ? Math.min(100, Math.round(((progress.loaded ?? 0) / (progress.total ?? 1)) * 100)) : null;
  const mb = progress?.loaded ? (progress.loaded / (1024 * 1024)).toFixed(1) : null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center p-4">
      <div className="glass w-[min(300px,100%)] border border-white/10 px-4 py-3.5 text-white">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[14px] font-medium tracking-[-0.42px]" aria-live="polite">
            {phase}
          </p>
          <p className="font-mono text-[10px] uppercase leading-4 text-white/60" aria-hidden>
            {pct !== null ? `${pct}%` : progress?.phase === "fetching" && mb ? `${mb} MB` : ""}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label={phase}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct ?? undefined}
          className="relative mt-3 h-px w-full overflow-hidden bg-white/15"
        >
          {pct !== null ? (
            <div className="h-px bg-brand transition-[width] duration-200" style={{ width: `${pct}%` }} />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-brand/70 motion-reduce:animate-none" />
          )}
        </div>
      </div>
    </div>
  );
}
