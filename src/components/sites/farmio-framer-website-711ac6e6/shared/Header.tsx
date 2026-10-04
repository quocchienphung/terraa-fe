"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { pauseSmoothScroll, resumeSmoothScroll } from "@/components/sites/anodeenergy-framer-website-108d0ac2/shared/SmoothScroll";
import { CONTACT_HREF, NAV_LINKS, VIEWROOM_LINK } from "./content";
import { FarmioLogo } from "./icons";
import { ArrowSwap } from "./PillButton";

const LINKS = [...NAV_LINKS, VIEWROOM_LINK];
const DESKTOP = "(min-width: 1200px)";

/** Scroll distances (px) for the hide-on-scroll-down / reveal-on-scroll-up behaviour. */
const TOP_ZONE = 8;
const HIDE_AFTER = 160;
const HIDE_DELTA = 24;
const REVEAL_DELTA = 12;

/** What the header floats over at the top of the page: `dark` (photo hero) → white text, `light` → ink text. */
export type HeaderSurface = "dark" | "light";

/**
 * Fixed, borderless navigation. At the top of the page there is no bar: logo, links and the lime CTA
 * float directly on the page (white on a dark hero, ink on a light page). Scrolling down slides the
 * header away so it never covers content; scrolling up brings it back on a frosted surface so the
 * links stay legible over whatever section is underneath. Keyboard focus always reveals it.
 * Desktop (≥1200): centred links + CTA. Tablet/phone: hamburger that drops a white panel.
 *
 * Contract with the Viewroom (`useSiteMenuOpen`): `#site-menu` is always mounted and its
 * `data-open` mirrors the menu state, so the 3D viewer yields input while the menu is open.
 */
export function Header({ surface = "light" }: { surface?: HeaderSurface }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  // Track scroll direction with a small dead-zone so Lenis' per-frame deltas don't make it flicker.
  useEffect(() => {
    let last = window.scrollY;
    let turn = last;
    let dir = 0;
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const d = Math.sign(y - last);
      if (d !== 0 && d !== dir) {
        dir = d;
        turn = last;
      }
      last = y;
      setAtTop(y <= TOP_ZONE);
      if (y < HIDE_AFTER) setHidden(false);
      else if (dir > 0 && y - turn > HIDE_DELTA) setHidden(true);
      else if (dir < 0 && turn - y > REVEAL_DELTA) setHidden(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
  const transparent = atTop && !open;
  const onDark = transparent && surface === "dark";

  return (
    <header
      data-surface={transparent ? surface : "frosted"}
      className={cn(
        "fixed inset-x-0 top-0 z-[60] px-5 transition-[translate,background-color,box-shadow,padding] duration-500 ease-farm motion-reduce:transition-none md:px-[30px]",
        transparent
          ? "pointer-events-none py-[23px] desk:py-10"
          : "bg-white/85 py-2.5 shadow-[0_1px_0_rgba(4,48,59,0.08),0_8px_24px_-12px_rgba(4,48,59,0.18)] backdrop-blur-xl backdrop-saturate-150 desk:py-3",
        open && "bg-white",
        hidden && !open ? "-translate-y-full has-[:focus-visible]:translate-y-0" : "translate-y-0",
      )}
    >
      <div ref={shellRef} className="pointer-events-auto mx-auto w-full max-w-[1320px]">
        <nav aria-label="Main" className="flex items-center justify-between">
          <Link
            href="/#home"
            aria-label="Farmio — home"
            className={cn(
              "block flex-none rounded-full transition-colors duration-500 ease-farm focus-visible:outline-2 focus-visible:outline-offset-4",
              onDark ? "text-white focus-visible:outline-white" : "text-farm-ink focus-visible:outline-farm-ink",
            )}
          >
            <FarmioLogo className="h-[33px] w-[100px] desk:h-11 desk:w-[135px]" />
          </Link>

          <ul className="hidden items-center desk:flex">
            {LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-[42px] px-[18px] py-[11px] fm-p16 no-underline transition-colors duration-300 ease-farm focus-visible:outline-none",
                      onDark
                        ? "text-white/85 hover:bg-white/15 hover:text-white focus-visible:bg-white/15 focus-visible:text-white"
                        : "text-farm-ink hover:bg-farm-ink hover:text-white focus-visible:bg-farm-ink focus-visible:text-white",
                      active && (onDark ? "bg-white/15 text-white" : "bg-farm-sand"),
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href={CONTACT_HREF}
            className={cn(
              "fm-btn hidden h-11 items-center gap-[10px] rounded-[42px] bg-farm-lime px-5 fm-p16 text-farm-ink no-underline hover:bg-farm-ink hover:text-farm-sand focus-visible:bg-farm-ink focus-visible:text-farm-sand focus-visible:outline-2 focus-visible:outline-offset-2 desk:inline-flex",
              onDark ? "focus-visible:outline-white" : "focus-visible:outline-farm-ink",
            )}
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
            className={cn(
              "relative -m-2.5 flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors duration-500 ease-farm focus-visible:outline-2 desk:hidden",
              onDark ? "text-white focus-visible:outline-white" : "text-farm-ink focus-visible:outline-farm-ink",
            )}
          >
            <span aria-hidden className="relative block size-6">
              <span className={cn("absolute left-0 top-[3px] h-0.5 w-6 rounded-[1px] bg-current transition-transform duration-300 ease-farm", open && "translate-y-2 rotate-45")} />
              <span className={cn("absolute left-0 top-[11px] h-0.5 w-6 rounded-[1px] bg-current transition-opacity duration-200", open && "opacity-0")} />
              <span className={cn("absolute left-0 top-[19px] h-0.5 w-6 rounded-[1px] bg-current transition-transform duration-300 ease-farm", open && "-translate-y-2 -rotate-45")} />
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
          <ul className="flex min-h-0 flex-col gap-3 overflow-hidden data-[open=true]:pb-4" data-open={open}>
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
