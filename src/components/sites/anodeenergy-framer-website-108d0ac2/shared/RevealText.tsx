"use client";

import { useEffect, useRef } from "react";
import { REVEAL } from "@/lib/motion-config";
import { groupWordsIntoLines, tokenizeWords } from "@/lib/split-lines";
import { watchReducedMotion } from "@/hooks/use-reduced-motion";

type RevealTag = "h1" | "h2" | "h3" | "p";

/**
 * Line-mask reveal measured on the reference: each rendered line sits in an
 * overflow-hidden mask and rises from translateY(130%) once it enters the viewport.
 *
 * The server renders plain, readable text. After fonts load, lines already in (or above)
 * the viewport stay put; only lines below the fold are hidden and later revealed, so there
 * is never a visible → hidden flash. When every line has played the split DOM is removed
 * and the element is plain text again (as on the reference). Assistive tech always reads
 * the original text span; the visual copy is aria-hidden.
 */
export function RevealText({ as: Tag, children, className, id }: { as: RevealTag; children: string; className?: string; id?: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const visualRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const textEl = textRef.current;
    const visual = visualRef.current;
    if (!root || !textEl || !visual) return;

    let disposed = false;
    let done = false;
    let reduced = true;
    let io: IntersectionObserver | null = null;
    let lastWidth = 0;
    let pending: HTMLElement[] = [];
    const running = new Set<Animation>();

    const restorePlainText = () => {
      io?.disconnect();
      io = null;
      running.forEach((a) => a.cancel());
      running.clear();
      pending = [];
      visual.replaceChildren();
      visual.style.display = "";
      textEl.classList.remove("sr-only");
      textEl.style.display = "";
    };

    const finish = () => {
      done = true;
      restorePlainText();
    };

    const maybeFinish = () => {
      if (pending.length === 0 && running.size === 0) finish();
    };

    const reveal = (inner: HTMLElement, delay: number, animate: boolean) => {
      pending = pending.filter((p) => p !== inner);
      if (!animate) {
        inner.style.transform = "none";
        return;
      }
      const anim = inner.animate([{ transform: `translateY(${REVEAL.fromPercent}%)` }, { transform: "translateY(0)" }], {
        duration: REVEAL.durationMs,
        easing: REVEAL.easing,
        delay,
        fill: "both",
      });
      running.add(anim);
      anim.onfinish = () => {
        inner.style.transform = "none";
        anim.cancel();
        running.delete(anim);
        maybeFinish();
      };
    };

    /** Measure the rendered lines and rebuild the masks. Idempotent. */
    const build = () => {
      if (disposed || done || reduced) return;
      io?.disconnect();
      running.forEach((a) => a.cancel());
      running.clear();

      // 1. Measure: lay the words out as inline spans in place of the text.
      const words = tokenizeWords(children);
      textEl.style.display = "none";
      visual.style.display = "block";
      visual.replaceChildren(
        ...words.flatMap((w) => {
          const s = document.createElement("span");
          s.textContent = w.text;
          return w.hardBreakAfter ? [s, document.createElement("br")] : [s];
        }),
      );
      const spans = Array.from(visual.querySelectorAll("span"));
      const lines = groupWordsIntoLines(words.map((w, i) => ({ ...w, top: spans[i].offsetTop })));
      lastWidth = root.clientWidth;

      // 2. Build masks.
      const inners: HTMLElement[] = [];
      visual.replaceChildren(
        ...lines.map((line) => {
          const mask = document.createElement("span");
          mask.className = "block overflow-hidden";
          mask.style.paddingBottom = `${REVEAL.maskPadEm}em`;
          mask.style.marginBottom = `-${REVEAL.maskPadEm}em`;
          const inner = document.createElement("span");
          inner.className = "block whitespace-nowrap will-change-transform";
          inner.textContent = line;
          mask.appendChild(inner);
          inners.push(inner);
          return mask;
        }),
      );
      textEl.style.display = "";
      textEl.classList.add("sr-only");

      // 3. Lines already in or above the viewport stay visible; the rest wait for the observer.
      const limit = window.innerHeight - REVEAL.triggerInsetPx;
      const tops = inners.map((inner) => (inner.parentElement as HTMLElement).getBoundingClientRect().top);
      pending = [];
      inners.forEach((inner, i) => {
        if (tops[i] < limit) {
          inner.style.transform = "none";
        } else {
          inner.style.transform = `translateY(${REVEAL.fromPercent}%)`;
          pending.push(inner);
        }
      });
      if (pending.length === 0) {
        finish();
        return;
      }

      io = new IntersectionObserver(
        (entries) => {
          const entering: HTMLElement[] = [];
          for (const e of entries) {
            const inner = (e.target as HTMLElement).firstElementChild as HTMLElement | null;
            if (!inner || !pending.includes(inner)) continue;
            if (e.isIntersecting) {
              entering.push(inner);
            } else if (e.boundingClientRect.bottom < 0) {
              // Flung past without ever intersecting: show it, no animation.
              io?.unobserve(e.target);
              reveal(inner, 0, false);
            }
          }
          entering
            .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
            .forEach((inner, i) => {
              io?.unobserve(inner.parentElement as HTMLElement);
              reveal(inner, i * REVEAL.staggerMs, true);
            });
          maybeFinish();
        },
        { rootMargin: `0px 0px -${REVEAL.triggerInsetPx}px 0px` },
      );
      pending.forEach((inner) => io?.observe(inner.parentElement as HTMLElement));
    };

    let resizeRaf = 0;
    const ro = new ResizeObserver(() => {
      if (done || reduced || Math.abs(root.clientWidth - lastWidth) < 1) return;
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(build);
    });

    let started = false;
    const stopWatching = watchReducedMotion((r) => {
      reduced = r;
      if (r) {
        restorePlainText();
        return;
      }
      if (!started) {
        started = true;
        document.fonts.ready.then(() => {
          if (!disposed) {
            build();
            ro.observe(root);
          }
        });
      } else {
        build();
      }
    });

    return () => {
      disposed = true;
      stopWatching();
      ro.disconnect();
      cancelAnimationFrame(resizeRaf);
      restorePlainText();
    };
  }, [children]);

  return (
    <Tag ref={rootRef as React.Ref<never>} id={id} className={className}>
      <span ref={textRef}>{children}</span>
      <span ref={visualRef} aria-hidden="true" className="hidden" />
    </Tag>
  );
}
