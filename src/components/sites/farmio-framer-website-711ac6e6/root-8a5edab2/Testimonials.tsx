"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Testimonial } from "@/types/farmio";
import { TESTIMONIALS } from "../shared/content";
import { QuoteIcon } from "../shared/icons";
import { SectionTag } from "../shared/SectionTag";
import { WordReveal } from "../shared/WordReveal";

const ITEMS = TESTIMONIALS.items;
const N = ITEMS.length;
/** Three copies: the visible window always has neighbours on both sides, and wraps invisibly. */
const LOOP = [...ITEMS, ...ITEMS, ...ITEMS];
const GAP = 24;
/** Sampled on the reference slideshow: a new card every ~2s (start to start), each slide ~1s. */
const INTERVAL_MS = 2000;
const SWIPE_PX = 50;

function Card({ t, hidden }: { t: Testimonial; hidden: boolean }) {
  return (
    <li
      aria-hidden={hidden || undefined}
      className="flex w-full flex-none flex-col-reverse justify-end gap-[30px] rounded-[20px] bg-white p-5 md:flex-row md:justify-between md:p-6 desk:w-[767px]"
    >
      <figure className="flex flex-col gap-10 md:w-[377px] md:flex-none">
        <div className="flex flex-col gap-10">
          <QuoteIcon className="size-7 text-farm-ink" />
          <blockquote className="fm-h5 text-wrap text-farm-ink">{t.quote}</blockquote>
        </div>
        <figcaption>
          <p className="fm-p16 text-farm-ink">{t.name}</p>
          <p className="fm-p14 text-farm-body">{t.role}</p>
        </figcaption>
      </figure>
      <div className="relative h-[270px] w-full flex-none overflow-hidden rounded-[10px] md:h-[260px] md:w-[312px] desk:h-[270px]">
        <Image src={t.image.src} alt={t.image.alt} fill sizes="(min-width: 768px) 312px, 100vw" className="object-cover" />
      </div>
    </li>
  );
}

/**
 * Framer-slideshow equivalent: an infinite, left-aligned row that advances one card at a time,
 * with page dots. Pauses while hovered or focused and never autoplays with reduced motion;
 * dots and horizontal swipes move it by hand.
 */
export function Testimonials() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(N); // first card of the middle copy
  const [animate, setAnimate] = useState(true);
  const [held, setHeld] = useState(false);
  const [step, setStep] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Card width + gap, measured (767 desktop, container width below 1200).
  useEffect(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!card) return;
    const measure = () => setStep(card.offsetWidth + GAP);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  const go = useCallback((next: number) => {
    setAnimate(true);
    setIndex(next);
  }, []);

  // Autoplay.
  useEffect(() => {
    if (reduced || held) return;
    const id = window.setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduced, held]);

  // After sliding into the first or last copy, jump (without animation) back to the same card in the middle copy.
  const onTransitionEnd = () => {
    if (index >= 2 * N || index < N) {
      setAnimate(false);
      setIndex(((index % N) + N) % N + N);
    }
  };

  const page = index % N;
  const setPage = (p: number) => go(index - page + p);

  return (
    <section id="testimonial" aria-labelledby="testimonials-title" className="overflow-hidden bg-farm-mist px-5 pb-[60px] pt-[60px] md:px-[30px] md:pb-20 md:pt-20 desk:pb-24 desk:pt-[120px]">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10 md:gap-[46px] desk:gap-[52px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-0">
          <div className="flex flex-col gap-4 md:w-[428px] desk:w-[529px] desk:gap-5">
            <SectionTag>{TESTIMONIALS.tag}</SectionTag>
            <WordReveal id="testimonials-title" className="fm-h2 text-farm-ink">
              {TESTIMONIALS.title}
            </WordReveal>
          </div>
          <p className="fm-p18 text-balance text-farm-body md:w-[280px] desk:w-[465px]">{TESTIMONIALS.body}</p>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Testimonials"
          onPointerEnter={(e) => e.pointerType === "mouse" && setHeld(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHeld(false)}
          onFocus={() => setHeld(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false);
          }}
        >
          <ul
            ref={trackRef}
            onTransitionEnd={(e) => e.target === e.currentTarget && onTransitionEnd()}
            onPointerDown={(e) => {
              swipe.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(index + (dx < 0 ? 1 : -1));
            }}
            className={cn("flex touch-pan-y gap-6 will-change-transform", animate && !reduced && "transition-transform duration-1000 ease-[cubic-bezier(0.45,0,0.2,1)]")}
            style={{ transform: `translate3d(${-index * step}px, 0, 0)` }}
          >
            {LOOP.map((t, i) => (
              <Card key={i} t={t} hidden={i !== index} />
            ))}
          </ul>

          <div className="mt-[60px] flex justify-center md:mt-20 desk:mt-[120px]">
            <div role="group" aria-label="Choose testimonial" className="flex rounded-[50px] bg-black/20">
              {ITEMS.map((t, p) => (
                <button
                  key={t.name}
                  type="button"
                  aria-label={`Show testimonial ${p + 1} of ${N}: ${t.name}`}
                  aria-current={p === page ? "true" : undefined}
                  onClick={() => setPage(p)}
                  className="group flex h-[26px] w-5 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-farm-ink"
                >
                  <span className={cn("block size-[10px] rounded-full bg-white transition-opacity duration-300", p === page ? "opacity-100" : "opacity-50 group-hover:opacity-80")} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
