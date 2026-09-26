# WhatWeDo Specification

## Overview
- **Target file:** `.../root-8a5edab2/WhatWeDo.tsx` (uses shared `ArrowCta`, `SectionLabel`)
- **Screenshot:** `ref-1440-sec3.png`, `ref-390-sec3.png`
- **Interaction model:** hover (arrow CTAs)

## DOM Structure
`section[flex col center, gap 10, padding 32px 32px 160px, bg #fff, overflow clip]`
- Container[max-w 1800, width 100%] > ContentWrap[flex col, align flex-start, gap 80]
  - Row A[flex col, gap 24, width 1101 (max-width 1101), overflow clip]
    - SectionLabel "What We Do" (dot 4×4 #00e05c, gap 10, Geist 14/16.8 500 ls -.56 #1c1c1c)
    - h3: Geist 48/55.2 400 ls -2.4 #121212 (width 1101)
  - Row B[flex, justify flex-end, gap 48, width 100%]
    - Wrap[flex col, gap 32, flex 0.5 0 0 → width 688]
      - CTA Row[flex, gap 16] > ArrowCta ×2 (flex 1 0 0 → 336×80 each)
      - p (Geist 14/16.8 500 ls -.56 #595959, width 344)

## ArrowCta (large variant) — computed
- `a[flex, justify space-between, align flex-end, gap 16, padding 48px 12px 12px, bg #f5f5f5, color #121212, overflow hidden, clip-path polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%), transition color .42s ease-cta]`
- label Geist 14/14 600 ls -.14
- `.sweep` absolute inset 0, bg #00e05c (Our Story) / #0a0a0a (Our Solutions), scaleX(0) origin right center, transition transform .42s ease-cta
- `.mask` 20×20 overflow hidden; `.out` & `.in` spans absolute inset 0; `.in` translateX(-130%)
- arrow svg 20×20 viewBox 0 0 24 24 stroke currentColor 1.5: `M4 12h15` + `M13 6l6 6-6 6`
- hover: sweep scaleX(1) origin left; `.out` translateX(130%); `.in` translateX(0); color #121212 (green) / #fff (black)

## Geometry @1440
- section y 1604 h 641; label y 1636; h3 y 1677 h 166; Row B y 1922; CTAs 720–1056 & 1072–1408 (y 1922–2002); p y 2034 w 344

## Text Content
- "What We Do"
- "We build, deploy, and run grid-scale battery storage — one team from the interconnection study through to the megawatt-hours a site bids each morning."
- CTAs: "Our Story" (→ /about), "Our Solutions" (→ /solutions/plp)
- "Owning the hardware and the dispatch software means the asset that gets built is the asset that gets bid — no seam between what is installed and what earns."

## Responsive
- **Phone/@768:** padding 32 16 80; ContentWrap gap 48; h3 32/36.8 ls -1.6 full width; Row B stacks (col, gap 32), Wrap full width; CTA Row col gap 8, each CTA full width ×80; p full width.
