# Solutions Specification (sticky stack)

## Overview
- **Target file:** `.../root-8a5edab2/Solutions.tsx` + `SolutionPanel.tsx`
- **Screenshot:** `ref-1440-sec4.png`, `ref-390-sec4.png`
- **Interaction model:** scroll-driven (position: sticky stack with scroll-linked dim overlay) + hover CTA

## DOM Structure
`section[flex col center, gap 10, bg #fff]` (desktop: no padding; phone: padding 80px 0)
- Container[max-w 1800] > ContentWrap[flex col, gap 32 (phone 40)]
  - Row[flex, gap 32, padding 0 32px (phone 0 20px)] > h2 "Our Solutions" (max-width 820; Geist 72/75.6 ls -2.88; phone 32/33.6 ls -1.28)
  - ProductsWrap[flex col] > ProductRow ×3 `[flex, align flex-start, position sticky, top 0, overflow hidden]`
    - ImageWrapper[flex 1 0 0, height = row height, overflow clip] > img cover (877×647)
    - InfoPanel[flex .55 0 0 → 563px, flex col, gap 48, padding 44px 40px, bg #f5f5f5]
      - HeadWrap[flex col gap 8]: p number (Spline Sans Mono 10/16 uppercase #666) + h4 (Geist 32/36.8 ls -1.28 #121212)
      - p intro (Geist 14/16.8 500 ls -.56 #121212)
      - CapabilitiesWrap[flex col gap 16]: p "CAPABILITIES:" (Spline Sans Mono 10/16 uppercase #595959) + CapabilityList[flex col gap 16] > Capability[flex center gap 16] > IconChip[34×34 bg #d2f2db radius 6, flex center] > Mark 18×18 svg (stroke #0a0a0a, width 1.5 for set 1, 1 for sets 2–3) + p label (Geist 14/16.8 500 ls -.56)
      - Spacer[flex 1 0 0]
      - p description (Geist 14/16.8 500 ls -.56 #121212) — **hidden on phone**
      - Wrap[overflow clip] > ArrowCta small (200×42, bg #e6e6e6, padding 12px 12px 14px, label Geist 12/12 600 ls -.12, mask 16×16, sweep #0a0a0a, hover color #fff)
    - Dim overlay `div[absolute inset 0, z 5, bg #0c0c0c, opacity 0, pointer-events none]`

## Geometry @1440
- section y 2245 h 2066; h2 y 2245 h 76; rows y 2352 (h 647), 3000 (h 664), 3664 (h 647). Row height = InfoPanel content height (image stretches).
- Panel contents: "01" y 2396; h4 y 2420; intro y 2505; CAPABILITIES y 2570; list y 2602 (rows 34px, gap 16); description y 2832; CTA y 2914 (200×42); panel bottom 2999.

## Behaviors
- Sticky stack: rows `position: sticky; top: 0`. Dim overlay of a covered row fades 0 → .42 as the next row's top goes from ~650px → 0 (linear-ish), stays .42.
- Implementation: rAF/scroll listener computing `next.getBoundingClientRect().top`; `opacity = 0.42 * clamp(1 - top / 650)`.

## Per-item content
1. 01 Systems — "Battery storage hardware, built for twenty-year assets." — LFP Storage (4 vertical lines M6 4v16 M11 4v16 M16 4v16 M21 4v16, sw 1.5), Bidirectional PCS (M4 20L18 6 / M18 16V6H8, sw 1.5), UL 9540A Enclosure (corner brackets M3 8V3h5 / M16 3h5v5 / M21 16v5h-5 / M8 21H3v-5, sw 1.5) — "Containerized LFP and bidirectional power conversion, tested at the enclosure rather than the cell — so what you certify is what you operate." — Explore Systems → /solutions/systems — image `solution-systems.webp` (2093×2400)
2. 02 Deployment — "Three ways to work with us: complete storage systems, deployment from site survey to energization, and the software that runs the fleet." — Engineering & Studies (M12 4v16 / M3 15h18, sw 1), Installation (M3 15l5-5 / M9 15l5-5 / M15 15l5-5 / M2 20h20, sw 1), Commissioning (circle r9 + r4 + r.6, sw 1) — "We carry the project from interconnection study through energization, which is how first revenue lands in fourteen months." — Explore Deployment → /solutions/deployment — image `solution-deployment.webp` (2400×1600)
3. 03 Software — "Monitoring and performance across every site." — Site Monitoring (magnifier: M14 10a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0 / M13.5 13.5L21 21, sw 1), Performance (M12 4v8 / M6 6l3 6 / M18 6l-3 6 / M2 17h20, sw 1), State of Health (circle r4.5 at 12,12 + rays M12 2v3 / M4.6 5.6l2.1 2.1 / M19.4 5.6l-2.1 2.1 / M12 19v3, sw 1) — "Forecasts price, bids into day-ahead and real-time, and tracks degradation block by block. Runs on our hardware or yours." — Explore Software → /solutions/software — image `solution-software.webp` (2400×2145)

## Responsive
- **Phone/@768:** ProductRow becomes column: ImageWrapper full width aspect 1.77273/1 (390×220); InfoPanel full width, gap 32, padding 32px 24px 36px; HeadWrap gap 16; h4 20/23 ls -.8; description paragraph hidden; CTA 200×42 unchanged. Rows still sticky top 0 with dim overlay.
