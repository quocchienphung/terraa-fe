import { cn } from "@/lib/utils";
import { DotArrowIcon } from "./icons";

/** 52×52 prev/next button with the dotted-arrow slide mask (projects + testimonials). */
export function CarouselButton({
  direction,
  onClick,
  label,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
  className?: string;
}) {
  const flip = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group inline-flex size-[52px] cursor-pointer items-center justify-center rounded-lg border-0 bg-panel p-0 text-ink-2 transition-[background-color,color] duration-[400ms] ease-cta hover:bg-ink-2 hover:text-panel focus-visible:bg-ink-2 focus-visible:text-panel focus-visible:outline-none",
        className,
      )}
    >
      <span aria-hidden className={cn("arrow-mask dot-mask block h-[15px] w-5", flip ? "dir-prev" : "dir-next")}>
        <span className="arrow-out">
          <DotArrowIcon flip={flip} />
        </span>
        <span className="arrow-in">
          <DotArrowIcon flip={flip} />
        </span>
      </span>
    </button>
  );
}
