import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "./icons";

type Variant = "panel" | "explore" | "brand";
type Sweep = "brand" | "ink" | "white";

const VARIANT: Record<Variant, { box: string; label: string; icon: number; mask: string }> = {
  /* 336×80 "Our Story / Our Solutions" boxes */
  panel: { box: "bg-panel pt-12 px-3 pb-3 text-ink-2", label: "text-[14px] leading-[14px] tracking-[-0.14px]", icon: 20, mask: "size-5" },
  /* 200×42 "Explore …" buttons */
  explore: { box: "bg-panel-2 pt-3 px-3 pb-[14px] text-ink-2", label: "text-[12px] leading-[12px] tracking-[-0.12px]", icon: 16, mask: "size-4" },
  /* 200×56 green "Start a Project" */
  brand: { box: "bg-brand pt-6 px-3 pb-3 text-ink-2", label: "text-[14px] leading-[14px] tracking-[-0.14px]", icon: 20, mask: "size-5" },
};

const SWEEP: Record<Sweep, { fill: string; hoverText: string }> = {
  brand: { fill: "bg-brand", hoverText: "group-hover:text-ink-2" },
  ink: { fill: "bg-ink", hoverText: "group-hover:text-white" },
  white: { fill: "bg-white", hoverText: "group-hover:text-ink-2" },
};

/**
 * Corner-cut call-to-action with the site's sweep fill and double-arrow mask.
 * Variants and sweep colors match each usage on the reference page.
 */
export function ArrowCta({
  href,
  label,
  variant = "panel",
  sweep = "brand",
  className,
}: {
  href: string;
  label: string;
  variant?: Variant;
  sweep?: Sweep;
  className?: string;
}) {
  const v = VARIANT[variant];
  const s = SWEEP[sweep];
  return (
    <Link
      prefetch={false}
      href={href}
      className={cn(
        "group clip-notch-12 relative flex w-full items-end justify-between gap-4 overflow-hidden font-semibold no-underline transition-colors duration-[420ms] ease-cta focus-visible:outline-none",
        v.box,
        s.hoverText,
        className,
      )}
    >
      <span aria-hidden className={cn("sweep", s.fill)} />
      <span className={cn("relative z-[1] whitespace-nowrap", v.label)}>{label}</span>
      <span aria-hidden className={cn("arrow-mask", v.mask)}>
        <span className="arrow-out">
          <ArrowRightIcon size={v.icon} />
        </span>
        <span className="arrow-in">
          <ArrowRightIcon size={v.icon} />
        </span>
      </span>
    </Link>
  );
}
