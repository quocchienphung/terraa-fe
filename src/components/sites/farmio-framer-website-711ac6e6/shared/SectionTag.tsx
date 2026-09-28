import { cn } from "@/lib/utils";

/** Small section label above every heading ("About Us", "Our services"…): 20px / 160%. */
export function SectionTag({ children, light = false, className }: { children: string; light?: boolean; className?: string }) {
  return <p className={cn("fm-h6", light ? "text-white" : "text-farm-ink", className)}>{children}</p>;
}
