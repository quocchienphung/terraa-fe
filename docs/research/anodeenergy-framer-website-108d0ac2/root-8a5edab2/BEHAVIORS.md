# Behaviors — anodeenergy.framer.website homepage

## Global
- **Lenis smooth scroll** on `<html>`. Replicate with the `lenis` package (default settings).
- ~~No entrance/appear animations.~~ **Corrected 2026-09-26** (see `MOTION_AUDIT.md`): the old check only covered above-the-fold text 300ms after DOMContentLoaded. Hero h1/h5 really are static, but the two hero supporting paragraphs, the What We Do statement, *Our Solutions*, *Where We Operate* and *Featured Projects* use per-line masks (`overflow:hidden; padding-bottom:.14em; margin-bottom:-.14em`, inner line `translateY(130%)` → 0). Measured: 750ms `cubic-bezier(0.25,1,0.5,1)`, 110ms stagger between lines entering together, each line triggers when its mask is ~20px inside the viewport, plays once, and the spans are removed afterwards.
- Easings used by the site's code components: `cubic-bezier(0.22, 0.61, 0.24, 1)` (CTAs, carousels, cards) and `cubic-bezier(0.16, 1, 0.3, 1)` (nav, menu).
- `prefers-reduced-motion: reduce` disables the tick-ring spin, pulse ring and CTA transitions on the source.

## Nav (fixed, 86px desktop / 72px phone)
- Always fixed & transparent; **never hides** on scroll, no border/background change.
- **Theme swap by section under the nav:** over dark sections (hero, globe, pre-footer, footer) logo = white, menu button bg `#f5f5f5` / icon `#0a0a0a`. Over white sections logo = `#0a0a0a`, menu button bg `#0a0a0a` / icon `#f5f5f5`. Transition `0.45s cubic-bezier(0.16,1,0.3,1)`. Contact button stays green.
- **Contact Us hover:** white `.cta-sweep` scaleX 0→1, transform-origin flips right→left (0.28s), text stays `#0a0a0a`.
- **Menu button hover:** bg `#0a0a0a`, color `#f5f5f5` (0.45s).
- **Menu button open state:** svg rotates 90°, `.mk-edge` rects scale(0)/opacity 0, `.mk-corner` rects scale 1/opacity 1 (0.5s) → 5 squares in an X.
- **Menu overlay:** fixed full-screen `#0a0a0a`, opacity 0→1 (0.35s open, 0.5s close), visibility toggled. Contents: 3 columns (padding 212px 44px 80px, gap 56px): MENU list (Home, About, Solutions [ 3 ], Projects [ 4 ]) Geist 54px ls -2.16px lh 64.8px; second list (Newsroom, Careers, Contact); right column FOLLOW US (Instagram, x, Facebook, Linkedin) Geist 14px lh 21.7px ls -.42px `#fcfcfc`, HQ address (underlined, 2 lines), clock "DALLAS" + local time (Fragment Mono 11px ls .22px). Labels PT Mono 11px uppercase `#7a7a7a`, 1px rules `#3a3a3a` (margin 14px 0 26px). Lines rise in via `overflow:hidden` masks (transform 0.75s). Link hover: text rolls up (duplicate copy translateY 100%→0) and a dotted arrow (35×26, margin-left 18px) fades in from translateX(-14px).

## Hero
- Background `<video autoplay loop muted playsinline>` object-fit cover, wrapper `filter: brightness(0.7)`; poster webp.
- Section `clip-path: polygon(0 0,100% 0,100% 100%,62% 100%,calc(62% - 60px) calc(100% - 55px),0 calc(100% - 55px))` (notch bottom-left, 55px tall). Same on all breakpoints.

## Client ticker
- Logo row (4 logoipsum svgs × 4 copies, height 22px, gap 90px) and ruler row (ticks 1×18px @ rgba(18,18,18,.55) every 5th, 1×8px @ .25 otherwise, gap 29px) are JS-driven. **Corrected 2026-09-26:** idle speeds are logos **40px/s**, ruler **56px/s** (the earlier 60/40 was swapped). Both are scroll-coupled: scrolling down turns them rightward, scrolling up leftward, the last direction persists, and speed ≈ base × (1 + scroll px/s ÷ 80). Center marker: 2×22px bar `#121212` + 10×6 triangle, static.

## What We Do — Arrow CTA (336×80 desktop, full-width phone)
- bg `#f5f5f5`, clip-path corner-cut 12px, padding 48px 12px 12px. Hover: `.sweep` scaleX 0→1 (origin right→left, 0.42s), color stays `#121212` for the green sweep (Our Story) or → white for the black sweep (Our Solutions). Arrow mask 20×20: `.out` → translateX(130%), `.in` from translateX(-130%) → 0.

## Our Solutions (sticky stack)
- Each "Product Row" is `position: sticky; top: 0; overflow: hidden`. Rows stack; when the next row slides over, the covered row's overlay (`bg #0c0c0c`) fades 0 → **0.42** while the next row's top travels from the covered row's height → 0. **Corrected 2026-09-26:** the curve is `0.42 × smoothstep(1 − top / rowHeight)` (1440×900: 0.006@600, 0.137@400, 0.325@200, 0.42@0; travel ≈ 875px at 768 where the row is 894px tall), not linear over a fixed 650px. Stays at 0.42 once covered.
- Explore CTA (200×42) bg `#e6e6e6`, padding 12px 12px 14px, hover black sweep + text white, 16px arrow mask.

## Global Footprint (map)
- 9 markers (40×40 buttons, `translate(-50%,-50%)`) at % positions. Active marker: color `#00e05c`, icon 17px, two rings (inset 5px, 1px green border, radius 50%): `.pulse` keyframes scale .45→1.8 / opacity .9→0 over 2.4s infinite; static ring opacity .55.
- Hover on marker: color → `#00e05c`.
- **Auto-cycles every 5s** (0→1→…→8→0). Clicking a marker selects it (timer restarts). *Reference only — the local upgrade replaces the still with a rotating WebGL Earth and deliberately drops auto-advance (see `MOTION_IMPLEMENTATION.md`).* The reference % positions are illustrative (Texas sites sit on Asia in the poster); they are not geography.
- Card (300×185): `left: min(X%, 100% - 344px); top: max(Y%, 330px); transform: translate(26px, calc(-100% + 10px))`; bg `rgba(16,16,16,.42)` + dashed grid svg, border 1px `rgba(255,255,255,.08)`, radius 12px, backdrop-filter blur(28px) saturate(1.15), padding 20px 22px 22px. Enter animation "rise": opacity 0→1, translateY(8px)→0 (~0.35s).
- Phone: card is `left:12px; right:12px; bottom:44px` (366×170, padding 15px 16px 16px, no transform).
- Legend bottom-left (Operating site / Office / In development) + counter "02 / 09" bottom-right, Spline Sans Mono 9.5px ls .57px uppercase `rgba(255,255,255,.72)`, inset 56px, bottom 24px.

## Featured Projects
- List: `display:flex; gap:8px; overflow-x:auto; scroll-snap-type:x mandatory` (scrollbar hidden); cards `scroll-snap-align:start`, 1203×687 (aspect 1.75) desktop, 307×496 (aspect .62) phone.
- Nav buttons: 52×52 radius 8 bg `#f5f5f5`; hover bg `#121212` color `#f5f5f5`, dotted arrow mask (20×15) `.out` translateX(±140%), `.in` from ∓140% → 0 (0.45s). Counter "01 / 04" PT Mono 10px ls -.2px `#595959`, right aligned, margin-bottom 16px.
- Auto-advances ≈ every 4.5s with smooth scroll (~500ms ease); wraps to 0 after the last.
- Card hover: `.media` scale(1.04) 0.7s; `.dim` opacity 0→.18 0.5s; `.arw` (24×18 dotted arrow, top 32 right 32) opacity 0→1 & translateX(-10px)→0 0.45s.

## Testimonial
- 3 items, auto-cycles ≈ 7s; prev/next buttons identical to carousel buttons. Counter "02 / 03" Spline Sans Mono 10px `#8a8a8a`.
- Transition: each quote line is masked (`overflow:hidden; padding-bottom:.06em; margin-bottom:-.06em`). Out: lines translateY 0 → -110% with ~60ms stagger (~0.7s). In: lines from +110% → 0 with the same stagger (~0.75s, ease-out). Author block: opacity 1→0 & translateY(-10px), then back in.

## News
- Static 4×350px grid gap 8px (desktop); single column gap 48px phone. No hover effect detected.

## Pre-Footer
- Two tick rings rotate: 640px ring `pfhud-spin` 80s linear infinite (clockwise), 860px ring `pfhud-spin-r` 130s linear infinite (counter-clockwise). Both centered at (50%, 270px) and sized 884/1103px. 3 static circles 560/980/1500px (border 1px rgba(255,255,255,.08/.06/.043)). Corner brackets 14×14 at x 230px/1196px, y 75.6px/450.4px (1px rgba(255,255,255,.18)). 8px side rulers `repeating-linear-gradient(rgba(255,255,255,.2) 0 1px, transparent 1px 9px)`.
- CTA (200×56) green, padding 24px 12px 12px, white sweep on hover.

## Footer
- Link hover: `Underline` (1px white, absolute bottom) grows from 1px to 100% width (~0.4s). Sign Up button white radius 2px.
- Vector background image (`footer-vector-bg.png`) rotated 180°, opacity .5.
