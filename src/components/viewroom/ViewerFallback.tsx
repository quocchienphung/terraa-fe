"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { MonitorOff, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface FallbackAction {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}

/**
 * Error / unsupported / context-lost card. Rendered in DOM over (or instead of) the canvas so the
 * rest of the page keeps working whatever happened to WebGL.
 */
export function ViewerFallback({
  kind,
  title,
  message,
  details,
  actions,
  posterUrl,
}: {
  kind: "error" | "unsupported";
  title: string;
  message: string;
  details?: string[];
  actions: FallbackAction[];
  posterUrl?: string;
}) {
  const Icon = kind === "unsupported" ? MonitorOff : TriangleAlert;
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center p-4">
      {posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- portable viewer core: no next/image
        <img src={posterUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
      ) : null}
      <div role="alert" className="glass pointer-events-auto relative w-[min(420px,100%)] border border-white/10 p-5 text-white">
        <Icon aria-hidden className="size-5 text-white/80" strokeWidth={1.75} />
        <h3 className="mt-3 text-[20px] font-medium leading-[1.2] tracking-[-0.8px]">{title}</h3>
        <p className="mt-2 text-[14px] leading-[1.45] tracking-[-0.28px] text-white/80">{message}</p>
        {details && details.length > 0 ? (
          <ul className="mt-3 flex max-h-32 flex-col gap-1 overflow-y-auto font-mono text-[11px] leading-4 text-white/60" data-lenis-prevent>
            {details.map((d) => (
              <li key={d} className="break-words">
                {d}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((a) => {
            const cls = cn(
              "inline-flex h-11 cursor-pointer items-center px-4 text-[12px] font-semibold tracking-[-0.36px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              a.primary ? "bg-brand text-ink hover:bg-white" : "bg-white/[0.08] text-white hover:bg-white/[0.16]",
            );
            return a.href ? (
              <a key={a.label} href={a.href} className={cls}>
                {a.label}
              </a>
            ) : (
              <button key={a.label} type="button" onClick={a.onClick} className={cls}>
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Catches render/shader exceptions thrown inside the canvas subtree. */
export class ViewerErrorBoundary extends Component<{ children: ReactNode; fallback: (reset: () => void, error: Error) => ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") console.error("[viewer]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.fallback(this.reset, this.state.error);
    return this.props.children;
  }
}
