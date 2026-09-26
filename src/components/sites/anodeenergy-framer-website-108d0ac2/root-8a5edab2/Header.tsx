"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/constants";
import { MenuMarkIcon } from "../shared/icons";
import { MenuOverlay } from "./MenuOverlay";

/** Vertical center of the nav bar — the point used to decide which section is "under" it. */
const PROBE_Y = 43;

/**
 * Fixed, transparent header. The logo and menu button swap between the light and dark
 * palettes depending on whether a `[data-nav-theme="dark"]` section sits under the bar.
 */
export function Header() {
  const [onDark, setOnDark] = useState(true);
  const [open, setOpen] = useState(false);

  const probe = useCallback(() => {
    const y = Math.min(PROBE_Y, window.innerHeight / 2);
    const dark = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-theme='dark']")).some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    setOnDark(dark);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(probe);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [probe]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // While the overlay is open the bar always sits on the dark overlay.
  const dark = open || onDark;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[72px] tab:h-[86px]">
        <nav aria-label="Main" className="relative h-full w-full">
          <div className="pointer-events-auto absolute inset-0 z-[2] flex items-center justify-between p-4 tab:px-7 tab:py-[22px]">
            <Link href="/" aria-label="Anode Energy — home" className="relative block h-[30px] w-[131px] focus-visible:outline-none">
              <span
                aria-hidden
                className={cn(
                  "block h-full w-full transition-colors duration-[450ms] ease-nav",
                  dark ? "bg-white" : "bg-ink",
                )}
                style={{
                  WebkitMaskImage: `url(${NAV.logo})`,
                  maskImage: `url(${NAV.logo})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            </Link>

            <div className="flex gap-1">
              <Link
                prefetch={false}
                href={NAV.contact.href}
                className="group relative inline-flex h-[42px] items-center justify-center overflow-hidden whitespace-nowrap bg-brand px-[26px] text-[12px] font-semibold leading-[12px] tracking-[-0.36px] text-ink no-underline transition-colors duration-[280ms] ease-nav focus-visible:outline-none"
              >
                <span aria-hidden className="sweep sweep-fast bg-white" />
                <span className="relative z-[1]">{NAV.contact.label}</span>
              </Link>

              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                aria-controls="site-menu"
                data-open={open}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                  "menu-mark flex size-[42px] cursor-pointer items-center justify-center border border-transparent p-0 transition-[background-color,color,border-color] duration-[450ms] ease-nav hover:bg-ink hover:text-panel focus-visible:outline-none",
                  dark ? "bg-panel text-ink" : "bg-ink text-panel",
                )}
              >
                <MenuMarkIcon />
              </button>
            </div>
          </div>
        </nav>
      </div>

      <MenuOverlay open={open} onNavigate={() => setOpen(false)} />
    </>
  );
}
