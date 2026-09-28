import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { ArrowIcon } from "./icons";

/** The arrow pair: the ink arrow slides out right while a sand one slides in from the left. */
export function ArrowSwap() {
  return (
    <span aria-hidden className="fm-arrow relative block h-[15px] w-4 flex-none overflow-hidden">
      <span className="absolute inset-0 block text-farm-ink">
        <ArrowIcon className="h-full w-full" />
      </span>
      <span className="fm-arrow-in absolute inset-0 block text-farm-sand">
        <ArrowIcon className="h-full w-full" />
      </span>
    </span>
  );
}

const PILL =
  "fm-btn group inline-flex h-11 flex-none items-center gap-[10px] whitespace-nowrap rounded-[42px] bg-farm-lime px-5 py-[9px] fm-p16 text-farm-ink no-underline hover:bg-farm-ink hover:text-farm-sand focus-visible:bg-farm-ink focus-visible:text-farm-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-ink";

/** Lime pill CTA (Framer "Button": 44px, radius 42, 9/20 padding, 16px label + arrow). */
export function PillButton({ children, className, ...rest }: ComponentProps<typeof Link>) {
  return (
    <Link className={cn(PILL, className)} {...rest}>
      <span>{children}</span>
      <ArrowSwap />
    </Link>
  );
}

/** Same pill as a native button (forms). */
export function PillSubmit({ children, className, ...rest }: ComponentProps<"button">) {
  return (
    <button className={cn(PILL, "cursor-pointer", className)} {...rest}>
      <span>{children}</span>
      <ArrowSwap />
    </button>
  );
}
