# FeaturedProjects Specification (carousel)

## Overview
- **Target file:** `.../root-8a5edab2/FeaturedProjects.tsx` + `ProjectCard.tsx` + shared `CarouselButton`
- **Screenshot:** `ref-1440-sec6.png`, `ref-390-sec6.png`
- **Interaction model:** time-driven auto-advance (~4.5s) + click (prev/next) + hover; scroll-snap list

## DOM Structure
`section[flex col center, gap 8, padding 180px 0 100px 8px, bg #fff, overflow clip]` (phone: padding 80px 16px 80px 0)
- Container[max-w 1800] > ContentWrap[flex col gap 32 (phone 48, padding-left 8)]
  - Row[flex, align flex-end, gap 32, padding 0 24 (phone: 0)]
    - Wrap[flex 1, flex col, gap 24 (phone padding-left 8)]: SectionLabel "Selected Work" + h2 "Featured Projects" (Geist 72/75.6 ls -2.88; phone 32/33.6 ls -1.28)
    - CarouselNav[112×84]: counter div (PT Mono 10/16 ls -.2 #595959, right aligned, margin-bottom 16) + buttons row[flex justify flex-end gap 8] > CarouselButton prev/next (52×52 radius 8 bg #f5f5f5 color #121212; hover bg #121212 color #f5f5f5; mask 20×15 with dotted arrow; prev arrow scaleX(-1))
  - ProjectsList[flex, gap 8, overflow-x auto, scroll-snap-type x mandatory, scrollbar hidden, width 100%]
    - CardLink `a[flex col, flex none, width 1203 (phone 307)]` > card `div[relative, bg #1a1a1a, radius 32, overflow hidden, aspect 1.75/1 (phone .62/1)]`
      - img.media absolute inset 0 cover (transition transform .7s ease-cta)
      - gradient overlay: linear-gradient(rgba(10,10,10,.157) 0%, rgba(10,10,10,.45) 100%)
      - `.dim` absolute inset 0 bg #0a0a0a opacity 0 (hover .18, .5s)
      - content `div[absolute inset 0, flex, justify space-between, align flex-end, gap 24, wrap, padding 14]`
        - left `div[flex 1 1 260, padding 0 0 34px 34px]` (phone padding 0 0 32 32? observed x -275 vs card -307 → 32px, y 5459): year (Fragment Mono 11/13.2 ls 1.1 rgba(255,255,255,.7), margin-bottom 16) + title (Inter 48/52.8 ls -1.44 #fff)
        - panel.glass `div[relative, flex 1 1 420, max-width 560, padding 36 (phone 24), bg rgba(16,16,16,.42) + grid svg, radius 18, backdrop blur(28px) saturate(1.15)]`
          - `.arw` absolute top 32 right 32, 24×18 dotted arrow, rgba(255,255,255,.85), opacity 0 translateX(-10px); hover → 1 / 0
          - metrics `div[flex gap 32 wrap]` × 3: label (Fragment Mono 11/13.2 ls 1.1 rgba(255,255,255,.7), margin-bottom 8) + value (Inter 38/38 ls -1.14 #fff; phone 26/26 ls -.78)
          - desc `div[margin-top 48, Inter 15/21.75 ls -.15 rgba(255,255,255,.82)]`

## Geometry @1440
- section y 5111 h 1116; label y 5291; h2 y 5332 h 76; nav counter y 5323; buttons y 5355; list y 5439 h 687; cards at x 8, 1219, 2430, 3641 (1203 wide, gap 8)
- panel 560×223 at card-right (x offset 637 of 1203), title block x+34 bottom 34

## Behaviors
- auto-advance: every ~4500ms `scrollTo({left: index*(cardW+8), behavior:'smooth'})`; index wraps to 0 after last (observed 3404 → 0). Prev/next buttons step ±1 with wrap. Counter shows current index (derived from scrollLeft / (cardW+8)).
- Hover (hover: hover): media scale(1.04); dim .18; arw visible.

## Slides
1. [2025] Bell Junction — 120 / 480 / 13 — "Hybrid site pairing existing generation with storage under a single point of interconnection." — /projects/bell-junction — `project-bell-junction.webp`
2. [2026] Cedar Bayou — 200 / 800 / 14 — "Four-hour storage co-located with an existing solar interconnect, bid into ERCOT day-ahead from month one." — /projects/cedar-bayou — `project-cedar-bayou.jpg`
3. [2025] Marfa Flats — 150 / 600 / 16 — "Standalone storage on a constrained node, cycling twice daily against congestion." — /projects/marfa-flats — `project-marfa-flats.webp`
4. [2024] Salt Fork — 90 / 360 / 15 — "First fleet site to complete a full augmentation cycle with no measured capacity shortfall." — /projects/salt-fork — `project-salt-fork.webp`
Metric labels: "[ MW ]", "[ MWH ]", "[ MONTHS ]"; year rendered "[ 2025 ]".

## Responsive
- **Phone/@768:** section padding 80 16 80 0; header row gap 32, h2 wraps to 2 lines; list cards 307×496 (aspect .62), inner padding 14, panel padding 24 (283×208), metrics 26px; title 48px wraps.
