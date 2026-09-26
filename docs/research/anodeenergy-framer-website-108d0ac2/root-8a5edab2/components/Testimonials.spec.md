# Testimonials Specification

## Overview
- **Target file:** `.../root-8a5edab2/Testimonials.tsx` (uses shared `CarouselButton`)
- **Screenshot:** `ref-1440-sec7.png`, `ref-390-sec7.png`
- **Interaction model:** time-driven (~7s) + click prev/next

## DOM Structure
`section[flex col center, gap 8, padding 32px 8px 160px, bg #fff]` (phone: padding 80px 16px)
- Container > ContentWrap[gap 80] > Row[padding 0 24 (phone 0), width 100%] > grid `[grid-template-columns 1fr 1.5fr, gap 48]` (phone: single column)
  - col-l `[flex col, justify space-between]`: mark “ (Georgia 160px, line-height .8 → 128px, #00e05c) ; nav `[flex center gap 8, margin-top 48]`: counter span (Spline Sans Mono 10/12 #8a8a8a, margin-right 8) + prev + next buttons (52×52)
  - col-r `[border-left 1px #e4e4e4, padding-left 32, flex col, gap 48]` (phone: no border, no padding)
    - kicker "WHAT OUR PARTNERS SAY" Spline Sans Mono 10/12 uppercase #8a8a8a
    - quote `[max-width 20ch → 636px, Geist 48/51.84 ls -1.44 #0a0a0a]` (phone 34/37.4 ls -1.02): lines each in `.ln[overflow hidden, padding-bottom .06em, margin-bottom -.06em] > span[block]`
    - author `[flex gap 32, margin-top auto]`: logo box `[200×133 (aspect 1.5), bg #ededed, padding 28, flex center]` > img contain; who `[flex 1, max-width 440, flex col]` > name div + role div (Geist 15/19.5 500 ls -.45 #0a0a0a; padding 14px 0; border-bottom 1px #e4e4e4; first also border-top)

## Geometry @1440
- section y 6226 h 693; grid 1376 wide at x 32; col-l 531 wide; col-r x 611 (content x 644); quote y 6318 h 259 (5 lines); author y 6616 h 133; nav y 6707

## Items (in order; counter 01/03 …)
1. "Anode took Cedar Bayou from interconnection study to first dispatch in fourteen months, and the enclosure we certified is the enclosure we operate." — Dana Whitfield — VP Development at Cedar Bayou Partners — `testimonial-logo-cedar-bayou.svg` (59×36)
2. "Their dispatch software paid for itself in the first quarter — day-ahead bids we could never have run by hand, and degradation tracked block by block." — Marcus Feld — Asset Manager at Marfa Flats Storage — `testimonial-logo-marfa-flats.svg` (97×50)
3. "The augmentation cycle at Salt Fork closed with no measured capacity shortfall. That is the first time a vendor has hit that number for us." — Priya Raghunathan — Head of Operations at Salt Fork Energy — `testimonial-logo-salt-fork.svg` (58×40)

## Behaviors
- Auto-advance every 7000ms; buttons step ±1 with wrap and restart the timer.
- Line transition: measure lines by splitting words into spans and grouping by offsetTop (re-run on resize). Out: each line translateY(0 → -110%) 0.7s ease-cta with 60ms stagger; In: translateY(110% → 0) 0.75s with 60ms stagger. Author: opacity 1→0 + translateY(-10px) 0.3s, swap, then 0→1.
- Phone order: kicker, quote, author, then nav row (counter + buttons) at the bottom (col-l mark hidden on phone — not visible in `ref-390-sec7.png`).
