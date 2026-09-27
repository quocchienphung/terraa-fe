"use client";

import dynamic from "next/dynamic";

/** Shown while the viewer bundle (R3F + three loaders) downloads; same footprint as the viewer. */
function ViewerSkeleton() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#121312]">
      <div className="glass w-[min(300px,calc(100%-32px))] border border-white/10 px-4 py-3.5 text-white">
        <p className="text-[14px] font-medium tracking-[-0.42px]" aria-live="polite">
          Starting 3D viewer
        </p>
        <div className="mt-3 h-px w-full animate-pulse bg-brand/70 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

// Client-only, code-split boundary: WebGL, Fiber and loaders never run on the server and never
// ship with other routes. `ssr: false` must live in a Client Component (Next 16 lazy-loading guide).
const ViewroomShell = dynamic(() => import("./ViewroomShell").then((m) => m.ViewroomShell), {
  ssr: false,
  loading: ViewerSkeleton,
});

export function ViewroomClient({ debug }: { debug: boolean }) {
  return <ViewroomShell debug={debug} />;
}
