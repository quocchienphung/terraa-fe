# Motion audit — anodeenergy.framer.website vs local

Date: 2026-09-26. Tooling: Playwright-core driving Chrome 154 (headless, Windows 11, i7-14700K,
RTX 4070 SUPER via ANGLE/D3D11). Values were read from computed styles every animation frame
(`requestAnimationFrame` sampling), not from single screenshots. Viewports: 1440×900 (main),
1440×700, 768×1024, 390×844; 2560×1009 from the user screenshot.

Labels used below:

- **Measured** — sampled on the reference with the method in the Evidence column.
- **Derived** — computed from measured samples (curve fits, ratios).
- **Proposed** — design value for the upgrade, no reference measurement exists.

## Inventory

| Element | Local file | Start → end state | Trigger | Driver | Duration / easing / stagger | Replay | Evidence | Certainty |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hero intro (h5), headline (h1) | `Hero.tsx` | none — opacity 1, `transform: none` from the first frame | — | — | — | — | Every frame 0–3 s after load sampled; only a font-swap layout shift (h1 top 541 → 634 px at 559 ms) | Measured, high |
| Hero supporting paragraphs ×2 | `Hero.tsx` | each line: `translateY(130%)` inside `overflow:hidden` mask → `none` | line mask top ≈ 20 px inside viewport bottom (top at 0.977–0.99 × vh) | time-driven after trigger | 750 ms, `cubic-bezier(0.25, 1, 0.5, 1)` | once; lines below the fold stay armed; no reset on scroll-up | 10 px scroll steps until the first line moved; per-frame samples; least-squares fit | Measured + derived, high |
| What We Do statement (h3) | `WhatWeDo.tsx` | same line masks | per line (lines still below the fold stay at 130 %) | time-driven | 750 ms, same easing; **110 ms** stagger when several lines enter together | once | Jump-scroll with all 3 lines in view: line starts at ≈20, 135, 245 ms | Measured, high |
| Our Solutions / Where We Operate / Featured Projects | `Solutions.tsx`, `GlobalFootprint.tsx`, `FeaturedProjects.tsx` | same; after the animation the spans are removed and the heading is plain text again | same | time-driven | 750 ms (fit rms 0.0008–0.0014) | once; DOM cleaned up | outerHTML after 2.2 s is plain text; scroll-up leaves it untouched | Measured, high |
| News, CTA, solution h4s, section labels | — | no masks, no transforms | — | — | — | — | DOM scan for masked spans | Measured, high |
| Mask geometry | `RevealText.tsx` | `display:block; overflow:hidden; padding-bottom:.14em; margin-bottom:-.14em`; inner `display:block; white-space:nowrap` | — | — | — | — | Inline styles in the reference DOM | Measured, high |
| Logo ticker | `ClientTicker.tsx`, `TickerMotion.tsx` | continuous translateX | autoplay | time **and** scroll | idle **40 px/s** leftward | continuous | Track with 16 SVGs: 39.98 px/s (1440), 40.04 (390); JS-driven (`animation: none`) | Measured, high |
| Ruler ticker | same | continuous translateX | autoplay | time **and** scroll | idle **56 px/s** leftward (ratio 1.4 to logos) | continuous | Track with 178 ticks: 55.97 / 56.05 px/s | Measured, high |
| Ticker scroll coupling | same | scrolling down turns both tracks **rightward**, scrolling up turns them leftward; direction persists after the scroll stops; speed ≈ base × (1 + scroll px/s ÷ 80) | wheel scroll | scroll-driven boost on top of autoplay | boost decays with Lenis' scroll tail | — | Per-frame track velocity vs scrollY during 6×100 px wheel bursts: −40/−56 px/s held for 2.5 s after scrolling down; +40/+56 after scrolling up; total extra travel ≈ 0.49 px per scrolled px (logos) | Measured + derived, medium–high (gain fitted from one burst each way) |
| Ticker centre pointer | `ClientTicker.tsx` | static | — | — | — | — | Outside the moving track | Measured, high |
| Solutions row dim | `Solutions.tsx` | overlay opacity 0 → 0.42 | next row top travels from the covered row's height to 0 | scroll-driven, reversible | `0.42 × smoothstep(1 − top / coveredRowHeight)` | follows scroll both ways | 1440×900: 0.006@600, 0.056@500, 0.137@400, 0.233@300, 0.325@200, 0.393@100, 0.42@0; travel ≈ 650 px at 1440, ≈ 875 px at 768 (row 894 px), ≈ 660 px at 390 — i.e. the row height, not a fixed 650 | Measured + derived, high |
| Globe | `GlobalFootprint.tsx` | reference is a **static** 2400×1350 image, 9 buttons, no canvas | — | — | markers auto-cycle every 5 s (from the earlier audit) | — | Section has 1 `<img>`, 0 `<canvas>` | Measured, high |
| Menu line masks | `MenuOverlay.tsx` | unchanged by this upgrade | — | — | 750 ms (from the earlier audit) | — | — | Not re-measured |

## What the new evidence overturns

1. `BEHAVIORS.md` said "No entrance/appear animations". The check ran 300 ms after DOMContentLoaded on
   above-the-fold text only. Line-mask reveals exist on 5 below-the-fold elements (table above).
2. The earlier audit had the ticker speeds the wrong way round (logos ≈ 60, ruler ≈ 40 px/s) and
   described them as pure autoplay. Measured: logos 40, ruler 56, and both are coupled to scroll
   direction and speed.
3. The Solutions dim is not linear over a fixed 650 px: it is a smoothstep over the covered row's height.

## Local before the upgrade (same method)

- Ticker: CSS keyframes, logos 60.38 px/s, ruler 40 px/s, no scroll coupling.
- Dim: linear over a fixed 650 px (e.g. 0.162 @400 vs 0.137 on the reference).
- No reveal system; hero/headings static.

## Local after the upgrade (same method, dev server, 1440×900)

- Reveal trigger at 0.968–0.978 × vh; fitted 730–760 ms easeOutQuart (rms ≤ 0.008); stagger 109 ms.
- Ticker idle 39–40 / 54–56 px/s leftward; scrolling down → −201…−442 / −281…−618 px/s, then −40/−55
  held; scrolling up → +415…+523 / +582…+732, back to +40/+56.
- Dim: 0.278@253, 0.361@153, 0.412@53 (reference 0.281@250, 0.363@150, 0.413@50).

## Not measured

- Fast "fling" on a touch device (only wheel bursts in desktop Chrome).
- Real 120 Hz / 60 Hz displays: headless Chrome ran rAF at ~141–165 Hz on this machine.
- Stripe Managed Payments globe: used only as a qualitative reference for depth and continuous
  motion; nothing was measured or copied from it.
