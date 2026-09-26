# Hero Specification

## Overview
- **Target file:** `.../root-8a5edab2/Hero.tsx`
- **Screenshot:** `ref-1440-sec1.png`, `ref-390-sec1.png`
- **Interaction model:** static (autoplaying muted looping video)

## DOM Structure
`section[flex col center, gap 80, padding 0 32px 100px, min-height 1170, overflow hidden, clip-path notch, z 1]`
- `div.Container[flex col, justify flex-end, align center, min-height 900, z 2, width 100%, max-width 1800]`
  - `div.HeroContent[flex col, align flex-start, gap 32, padding-bottom 80, width 100%]`
    - `div.CopyColumns[flex, justify flex-end, align flex-start, gap 180, width 1238 (centered? no: width = 1376 - 138)]` → contains `h5` Process copy (flex 1 0 0, max-width 300)
    - `div.Row[flex col, gap 48, overflow clip, width 100%]`
      - Light label: dot 4×4 #00e05c + p "Home" (Geist 14/16.8 500 ls -.56 #fff), gap 10
      - Divider 1px rgba(255,255,255,.26) full width
      - HeadlineWrap[max-width 1000, padding-bottom 10] > h1
- `div.HeroRight[flex col, align flex-end, width 1238, gap 48]` > `div.CopyColumns[flex, justify flex-end, gap 120]` > two `p` columns (flex 1 0 0, max-width 300)
- `div.ImageWrapper[absolute inset 0, z -1, overflow hidden, same clip-path]` > `div[filter brightness(.7)]` > `video[cover]`

## Computed Styles (desktop 1440)
- section: 1440×1170; clip-path `polygon(0 0,100% 0,100% 100%,62% 100%,calc(62% - 60px) calc(100% - 55px),0 calc(100% - 55px))`
- Container: x 32, w 1376, min-height 900 (= viewport height at capture; use `min-height: 100vh` capped… source uses fixed 900px on desktop: `min-height: 900px`)
- HeroContent y 398 h 513 (bottom at 911)
- h5 (Process copy): x 970 y 398 w 300; Geist 18px/22.5 500 ls -.72 #f5f5f5
- Light label: y 520; Divider y 585; Headline y 634
- h1: Geist 104px/93.6 400 ls -5.2 #fff; width 1000
- HeroRight: y 991 (80px gap after Container), x 101 w 1238 (centered under 1376 container: (1376-1238)/2 = 69 → 32+69 = 101)
- HeroRight columns: Practice copy x 619 w 300 (Geist 14/16.8 500 ls -.56 #f5f5f5), Process copy x 1039 w 300 — gap 120, aligned to right edge (1339)
- bottom padding 100 → section bottom 1170

## Assets
- `public/images/reference/hero-battery-storage.mp4`, poster `hero-battery-storage-poster.webp` (2400×1350)

## Text Content
- h5: "Utility-scale storage hardware and the dispatch software that decides when it earns — from interconnection to first revenue in 14 months."
- label: "Home"
- h1: "We build grid-scale storage. We also run it."
- p1: "Containerized LFP storage and bidirectional power conversion, engineered as a single certified unit and built for twenty-year assets."
- p2: "Deployed on a twelve to sixteen month schedule and dispatched from day one on our own software, with fleet availability published every year."

## Responsive Behavior
- **Phone (≤809) @390:** section padding 0 16px 180px, gap 32; Container min-height 844 (viewport), align flex-start; HeroContent gap 48, padding-bottom 100; copy columns stack (flex col gap 32); h5 16/20 ls -.64; Row gap 24; h1 48/43.2 ls -1.92, width 100%; HeroRight stacks (flex col gap 24) order: Process copy (p2) first then Practice copy (p1) — observed order at 390: p2 y 876, p1 y 967. Section height 1198.
- **@768:** identical to phone (Container min-height 1024 = viewport), section 1378.
- **Tablet (810–1199):** phone-like layout with min-height 100vh.
