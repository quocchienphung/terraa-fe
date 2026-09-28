"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";

type Tag = "h1" | "h2" | "h3" | "p";

/**
 * Framer word effect measured on the reference: each word fades in from opacity 0 / blur(4px),
 * ~0.55s, 60ms apart, once the heading enters the viewport.
 *
 * Words render visible from the server. After hydration, headings already on screen are left
 * alone (no visible → hidden flash); headings below the fold are hidden and play once when they
 * scroll in. Reduced motion never hides anything.
 */
export function WordReveal({
  as = "h2",
  children,
  className,
  id,
}: {
  as?: Tag;
  children: string;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.reveal = "hidden";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "play";
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = as;
  const words = children.split(" ");
  return (
    <Component ref={ref} id={id} className={className}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="fm-word inline-block" style={{ "--i": i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Component>
  );
}
