# Header Specification

## Overview
- **Target file:** `src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Header.tsx` (+ `MenuOverlay.tsx`)
- **Screenshot:** `docs/design-references/anodeenergy-framer-website-108d0ac2/root-8a5edab2/ref-1440-sec1.png`, `ref-1440-menu.png`
- **Interaction model:** scroll-driven theme swap + click (menu overlay)

## DOM Structure
`div[fixed, inset 0 0 auto, height 86, z 10] > nav > div[flex space-between center, padding 22px 28px]`
- left: `a[href=/]` containing logo `span` 131×30 (mask-image `nav-logo.svg` 179×41, mask-size contain, background-color = current logo color)
- right `div[flex gap 4px]`: Contact CTA `a` 112×42 + menu `button` 42×42

## Computed Styles
### Container
- position fixed; top 0; left 0; right 0; height 86px (phone: 72px, padding 16px 16px)
- padding 22px 28px; display flex; justify-content space-between; align-items center; z-index 10; background transparent

### Logo
- width 130.97px; height 30px; background-color #fff (dark theme) / #0a0a0a (light theme); transition background-color .45s cubic-bezier(.16,1,.3,1)
- mask: url(nav-logo.svg) center / contain no-repeat

### Contact CTA
- display inline-flex; height 42px; padding 0 26px; background #00e05c; color #0a0a0a; font Geist 12px 600 / 12px, ls -0.36px; white-space nowrap; overflow hidden
- `.cta-sweep` absolute inset 0 bg #fff scaleX(0) origin right center; transition transform .28s cubic-bezier(.16,1,.3,1)
- hover: sweep scaleX(1) origin left center; color stays #0a0a0a

### Menu button
- 42×42; display flex center; background #f5f5f5; color #0a0a0a; border 1px solid transparent; transition background .45s, color .45s (ease-nav)
- light theme (over white sections): background #0a0a0a; color #f5f5f5
- hover: background #0a0a0a; color #f5f5f5
- svg 16×16 viewBox 0 0 24 24, 7 rects 4×4: edges at (4,10) (16,10), hold (10,10), corners (4,4) (16,4) (4,16) (16,16). Rest: corners opacity 0 scale 0. Open: svg rotate(90deg) .55s; edges opacity 0 scale 0; corners opacity 1 scale 1 (.5s). transform-box fill-box, origin center.

## States & Behaviors
### Theme swap
- **Trigger:** which section is under the nav bar's vertical center (dark sections: hero, globe, pre-footer, footer).
- **State A (dark bg):** logo #fff, button bg #f5f5f5 color #0a0a0a
- **State B (light bg):** logo #0a0a0a, button bg #0a0a0a color #f5f5f5
- **Transition:** .45s cubic-bezier(.16,1,.3,1)
- **Implementation:** IntersectionObserver on `[data-nav-theme="dark"]` sections with rootMargin so the boundary is 43px from top.

### Menu overlay (see BEHAVIORS.md)
- fixed inset 0 bg #0a0a0a z 100; opacity 0/visibility hidden → 1/visible (.35s open / .5s close, ease-nav)
- inner grid: padding 212px 44px 80px; columns 3 (413px each, gap 56px) desktop; phone: padding 120px 16px 48px single column.
- col label: PT Mono 11px/15.4 uppercase #7a7a7a; rule 1px #3a3a3a margin 14px 0 26px
- big links: Geist 54px/64.8 ls -2.16 #fff; li height 65px; `sup` PT Mono 11px ls .66px #7a7a7a margin 3.74px 0 0 6px "[ 3 ]"
- small links: Geist 14px/21.7 ls -.42 #fcfcfc; ul margin-bottom 56px
- HQ: two underlined lines Geist 14px #fff; clock row margin-top 30px gap 12px: svg 30×30 (circle r14 stroke #3a3a3a), "DALLAS" Fragment Mono 11px/14.85 ls .22 #fff, time #7a7a7a
- link hover: text-roll (duplicate translateY 100%→0, .5s ease-cta) + dotted arrow 35×26 margin-left 18px opacity 0→1 translateX(-14px→0)
- open: lines rise from translateY(110%) → 0 (.75s ease-nav, stagger 40ms)

## Assets
- `public/images/reference/nav-logo.svg` (mask)

## Text Content
Contact Us · Menu: Home, About, Solutions [ 3 ], Projects [ 4 ] · Newsroom, Careers, Contact · FOLLOW US: Instagram, x, Facebook, Linkedin · HQ: 2100 McKinney Ave / Dallas, TX 75201 · DALLAS + local time (America/Chicago)

## Responsive Behavior
- **Desktop/Tablet:** as above. **Phone (≤809):** height 72px, padding 16px; logo same size; menu overlay single column, links 40px.
