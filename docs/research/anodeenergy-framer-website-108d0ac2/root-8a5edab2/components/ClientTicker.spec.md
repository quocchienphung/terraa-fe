# ClientTicker Specification (logo marquee + ruler)

## Overview
- **Target file:** `.../root-8a5edab2/ClientTicker.tsx`
- **Screenshot:** `ref-1440-sec2.png`
- **Interaction model:** time-driven (continuous marquee)

## DOM Structure
`section[flex col center, gap 10, padding 80px 0 160px, bg #fff, overflow clip]`
- Container[flex col center, gap 96, max-w 1800] > ContentWrap[flex col center, gap 80]
  - EyebrowRow: pill `div[flex center, gap 8, padding 8px 16px, bg #f5f5f5, radius 861px]` > p (Spline Sans Mono 10/16 uppercase #666, centered)
  - ClientTicker[width 100%, height 82]
    - logos track[height 22, overflow hidden] > row[flex center, gap 90px, translateX animating] > svg×16 (4 logos repeated), each height 22, width per viewBox (48.4 / 147.4 / 107.76 / 166.65)
    - ruler[margin-top 28, height 32, overflow hidden, position relative]
      - ticks row[flex, align flex-start, gap 29px, translateX animating] > span 1px wide: every 5th 18px tall rgba(18,18,18,.55), others 8px rgba(18,18,18,.25)
      - center bar: absolute left 50% top 0 width 2px height 22px bg #121212 margin-left -1px
      - triangle: absolute left 50% top 24px, border-bottom 6px solid #121212, border-left/right 5px transparent, margin-left -5px

## Computed Styles
- section 1440×434 (@390: padding 80px 16px, height 318; Container gap 56, ContentWrap gap 44)
- pill 344×32 at y 1250 (80 below top)
- logos row y 1362 (80 below pill), ticks y 1412

## Behaviors
- logos: translateX decreasing continuously (linear). Observed -1301px after ~20s → ≈ 60px/s. Seamless loop (row repeated).
- ticks: ≈ 40px/s, same direction (leftwards).

## Assets
- 4 inline logoipsum svgs (see `src/components/sites/.../shared/icons.tsx` → `MarqueeLogos`)

## Text Content
"POWERING THE GRID FOR OPERATORS ACROSS NORTH AMERICA"

## Responsive
- Phone: same, padding 80 16; logos overflow clipped by section.
