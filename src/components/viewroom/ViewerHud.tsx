"use client";

import {
  CircleQuestionMark,
  Clapperboard,
  Info,
  Maximize2,
  Minimize2,
  Move3d,
  Pause,
  Play,
  Rotate3d,
  RotateCcw,
  SkipBack,
  X,
  type LucideIcon,
} from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CameraMode, ViewerStatus } from "@/lib/viewroom/viewerTypes";
import type { TourState } from "./viewerCommands";

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  /** Extra tooltip text (shortcut, explanation). */
  hint?: string;
  active?: boolean;
  /** Show the text label from the tablet breakpoint up (icon-only below). */
  showLabel?: boolean;
};

/** 44px square-cut control, site typography, brand fill when active, tooltip on hover/focus. */
export const ToolButton = forwardRef<HTMLButtonElement, ToolButtonProps>(function ToolButton(
  { icon: Icon, label, hint, active, showLabel = true, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "group/tb relative inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 px-3 text-[12px] font-semibold leading-none tracking-[-0.36px] transition-colors duration-[280ms] ease-nav",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-35",
        active ? "bg-brand text-ink" : "bg-white/[0.06] text-white hover:bg-white/[0.14]",
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden className="size-4 flex-none" strokeWidth={1.75} />
      {showLabel ? <span className="hidden whitespace-nowrap tab:inline">{label}</span> : null}
      <span
        role="presentation"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap bg-ink px-2 py-1 font-mono text-[10px] uppercase leading-4 text-white opacity-0 transition-opacity duration-200 group-hover/tb:opacity-100 group-focus-visible/tb:opacity-100"
      >
        {hint ?? label}
      </span>
    </button>
  );
});

function Group({ children, label, className }: { children: ReactNode; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("glass pointer-events-auto flex gap-1 border border-white/10 p-1", className)}>
      {children}
    </div>
  );
}

export interface ViewerToolbarProps {
  mode: CameraMode;
  flyAvailable: boolean;
  tourAvailable: boolean;
  ready: boolean;
  fullscreen: boolean;
  panel: "info" | "help" | null;
  actions?: ReactNode;
  onMode: (mode: CameraMode) => void;
  onReset: () => void;
  onFullscreen: () => void;
  onPanel: (panel: "info" | "help") => void;
}

export function ViewerToolbar(p: ViewerToolbarProps) {
  return (
    <>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex items-end justify-center gap-2 p-3 tab:justify-start tab:p-4">
      <div className="flex justify-center gap-2">
        <Group label="Camera mode">
          <ToolButton icon={Rotate3d} label="Orbit" hint="Drag to rotate · scroll to zoom" active={p.mode === "explore"} aria-pressed={p.mode === "explore"} disabled={!p.ready} onClick={() => p.onMode("explore")} />
          {p.flyAvailable ? (
            <ToolButton icon={Move3d} label="Fly" hint="WASD to move · click to look" active={p.mode === "fly"} aria-pressed={p.mode === "fly"} disabled={!p.ready} onClick={() => p.onMode("fly")} />
          ) : null}
          <ToolButton
            icon={Clapperboard}
            label="Tour"
            hint={p.tourAvailable ? "Guided camera tour" : "Tour unavailable for this model"}
            active={p.mode === "cinematic"}
            aria-pressed={p.mode === "cinematic"}
            disabled={!p.ready || !p.tourAvailable}
            onClick={() => p.onMode("cinematic")}
          />
        </Group>
        <Group label="View">
          <ToolButton icon={RotateCcw} label="Reset view" disabled={!p.ready} onClick={p.onReset} />
          <ToolButton icon={p.fullscreen ? Minimize2 : Maximize2} label={p.fullscreen ? "Exit fullscreen" : "Fullscreen"} aria-pressed={p.fullscreen} onClick={p.onFullscreen} />
        </Group>
      </div>
    </div>
    {/* Phones: a column at top-right keeps the bottom toolbar to one row. Tablet+: bottom-right. */}
    <div className="pointer-events-none absolute right-3 top-3 z-[3] tab:bottom-4 tab:right-4 tab:top-auto">
      <Group label="Model" className="flex-col tab:flex-row">
        {p.actions}
        <ToolButton icon={Info} label="Info" active={p.panel === "info"} aria-expanded={p.panel === "info"} aria-controls="viewer-info" onClick={() => p.onPanel("info")} />
        <ToolButton icon={CircleQuestionMark} label="Help" active={p.panel === "help"} aria-expanded={p.panel === "help"} aria-controls="viewer-help" onClick={() => p.onPanel("help")} />
      </Group>
    </div>
    </>
  );
}

export function TourBar({ tour, onPlay, onPause, onRestart, onExit }: { tour: TourState; onPlay: () => void; onPause: () => void; onRestart: () => void; onExit: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[76px] z-[3] flex justify-center px-3 tab:bottom-[84px]">
      <div role="group" aria-label="Tour playback" className="glass pointer-events-auto flex items-center gap-1 border border-white/10 p-1">
        {tour.playing ? (
          <ToolButton icon={Pause} label="Pause" showLabel={false} onClick={onPause} />
        ) : (
          <ToolButton icon={Play} label={tour.ended ? "Play again" : "Play"} showLabel={false} onClick={tour.ended ? onRestart : onPlay} />
        )}
        <ToolButton icon={SkipBack} label="Restart" showLabel={false} onClick={onRestart} />
        <div className="mx-2 w-28 tab:w-44" aria-hidden>
          <div className="h-px w-full bg-white/20">
            <div className="h-px bg-brand" style={{ width: `${Math.round(tour.progress * 100)}%` }} />
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {tour.ended ? "Tour finished" : tour.playing ? "Tour playing" : "Tour paused"}
        </span>
        <ToolButton icon={X} label="Exit tour" showLabel={false} onClick={onExit} />
      </div>
    </div>
  );
}

const STATUS_TEXT: Record<ViewerStatus, string> = {
  idle: "Not loaded",
  "loading-viewer": "Starting viewer",
  "loading-asset": "Loading",
  ready: "Ready",
  error: "Could not load",
  unsupported: "3D unavailable",
  "context-lost": "Paused",
};

export function ViewerMeta({ label, tags, status }: { label: string; tags: string[]; status: ViewerStatus }) {
  const tone = status === "ready" ? "bg-brand" : status === "error" || status === "unsupported" ? "bg-[#ff6b5a]" : "bg-white/50";
  return (
    <div className="glass pointer-events-auto max-w-[min(360px,calc(100%-24px))] border border-white/10 px-3 py-2.5 tab:px-4 tab:py-3">
      <p className="whitespace-nowrap font-mono text-[10px] uppercase leading-4 text-white/60">{tags.join(" · ")}</p>
      <h2 className="mt-1 truncate text-[18px] font-medium leading-[1.2] tracking-[-0.72px] text-white tab:text-[20px]">{label}</h2>
      <p className="mt-1.5 flex items-center gap-2 font-mono text-[10px] uppercase leading-4 text-white/80">
        <span aria-hidden className={cn("block size-1.5 flex-none", tone, status === "loading-asset" && "animate-pulse")} />
        <span aria-live="polite">{STATUS_TEXT[status]}</span>
      </p>
    </div>
  );
}

export function FlyHint({ locked }: { locked: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[3] hidden justify-center px-3 tab:top-4 tab:flex">
      <p className="glass border border-white/10 px-3 py-2 font-mono text-[10px] uppercase leading-4 text-white/85">
        {locked ? "WASD move · Q/E down/up · Shift faster · Esc release mouse" : "Click the scene to look around · WASD move · Esc back to Orbit"}
      </p>
    </div>
  );
}
