import { cn } from "@/lib/utils";

/** Green 4px square + 14px label ("What We Do", "Selected Work", ...). */
export function SectionLabel({ children, light = false, className }: { children: string; light?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-[10px]", className)}>
      <span aria-hidden className="block size-1 flex-none bg-brand" />
      <p className={cn("whitespace-pre text-[14px] font-medium leading-[16.8px] tracking-[-0.56px]", light ? "text-white" : "text-label")}>
        {children}
      </p>
    </div>
  );
}
