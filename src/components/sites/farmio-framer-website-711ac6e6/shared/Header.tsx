"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { pauseSmoothScroll, resumeSmoothScroll } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/SmoothScroll";
import { CONTACT_HREF, LOGO, NAV_LINKS, VIEWROOM_LINK } from "./content";
import { ArrowSwap } from "./PillButton";

const LINKS = [...NAV_LINKS, VIEWROOM_LINK];
const DESKTOP = "(min-width: 1200px)";

/**
 * Fixed pill navigation. Desktop (≥1200): white 64px pill, centred links, lime CTA.
 * Tablet/phone: 48px pill with a hamburger that expands the same pill into a link list.
 *
 * Contract with the Viewroom (`useSiteMenuOpen`): `#site-menu` is always mounted and its
 * `data-open` mirrors the menu state, so the 3D viewer yields input while the menu is open.
 */
export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // Menu open: stop page scroll (Lenis and native), close on Escape, outside press or desktop resize.
  useEffect(() => {
    if (!open) return;
    pauseSmoothScroll();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onDown = (e: PointerEvent) => {
      if (!shellRef.current?.contains(e.target as Node)) close(false);
    };
    const mql = window.matchMedia(DESKTOP);
    const onMql = () => {
      if (mql.matches) close(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    mql.addEventListener("change", onMql);
    return () => {
      document.body.style.overflow = "";
      resumeSmoothScroll();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      mql.removeEventListener("change", onMql);
    };
  }, [open, close]);

  const isActive = (href: string) => !href.includes("#") && pathname === href;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[60] px-5 py-[15px] desk:px-[30px] desk:py-8">
      <div
        ref={shellRef}
        className="pointer-events-auto mx-auto w-full max-w-[1320px] rounded-[20px] bg-white py-2 pl-2 pr-4 desk:rounded-[56px] desk:pr-2"
      >
        <nav aria-label="Main" className="flex items-center justify-between">
          <Link href="/#home" aria-label="Farmio — home" className="block flex-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-ink">
            <Image src={LOGO.src} alt="" width={LOGO.width} height={LOGO.height} className="h-[33px] w-[100px] desk:h-11 desk:w-[135px]" preload />
          </Link>

          <ul className="hidden items-center desk:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-[42px] px-[18px] py-[11px] fm-p16 text-farm-ink no-underline transition-colors duration-300 ease-farm hover:bg-farm-ink hover:text-white focus-visible:bg-farm-ink focus-visible:text-white focus-visible:outline-none",
                    isActive(l.href) ? "bg-farm-sand" : "bg-white",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href={CONTACT_HREF}
            className="fm-btn hidden h-11 items-center gap-[10px] rounded-[42px] bg-farm-lime px-5 fm-p16 text-farm-ink no-underline hover:bg-farm-ink hover:text-farm-sand focus-visible:bg-farm-ink focus-visible:text-farm-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-farm-ink desk:inline-flex"
          >
            <span>Contact us</span>
            <ArrowSwap />
          </Link>

          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
            className="relative -m-2.5 flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-farm-ink desk:hidden"
          >
            <span aria-hidden className="relative block size-6">
              <span className={cn("absolute left-0 top-[3px] h-0.5 w-6 rounded-[1px] bg-farm-ink transition-transform duration-300 ease-farm", open && "translate-y-2 rotate-45")} />
              <span className={cn("absolute left-0 top-[11px] h-0.5 w-6 rounded-[1px] bg-farm-ink transition-opacity duration-200", open && "opacity-0")} />
              <span className={cn("absolute left-0 top-[19px] h-0.5 w-6 rounded-[1px] bg-farm-ink transition-transform duration-300 ease-farm", open && "-translate-y-2 -rotate-45")} />
            </span>
          </button>
        </nav>

        {/* Always mounted (menu contract above); collapsed to 0 rows when closed. */}
        <div
          id="site-menu"
          data-open={open}
          inert={!open}
          className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-400 ease-farm data-[open=true]:grid-rows-[1fr] desk:hidden"
        >
          <ul className="flex min-h-0 flex-col gap-3 overflow-hidden px-4 data-[open=true]:pb-4" data-open={open}>
            {[...LINKS, { label: "Contact Us", href: CONTACT_HREF }].map((l, i) => (
              <li key={l.href} className={i === 0 ? "pt-[17px]" : undefined}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  onClick={() => close(false)}
                  className="block fm-p18 text-farm-ink no-underline hover:opacity-70 focus-visible:underline focus-visible:outline-none aria-[current=page]:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
