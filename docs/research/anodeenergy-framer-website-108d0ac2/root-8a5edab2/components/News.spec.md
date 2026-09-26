# News Specification

## Overview
- **Target file:** `.../root-8a5edab2/News.tsx` + `NewsCard.tsx`
- **Screenshot:** `ref-1440-sec8.png`, `ref-390-sec8.png`
- **Interaction model:** static (no hover effect detected)

## DOM Structure
`section[flex col center, gap 8, padding 160px 8px, bg #fff, overflow clip]` (phone: 80px 8px)
- Container > ContentWrap[gap 80 (phone 48)]
  - Row[flex, gap 32, padding-left 24 (phone 12)]: Wrap-left[flex .5 0 0] > SectionLabel "News"; Wrap-right[flex 1 0 0] > h3 (Geist 48/55.2 ls -2.4; phone 32/36.8 ls -1.6) — phone: Row stacks (col, gap 24)
  - NewsList `grid[columns repeat(4, 350px) → use 4×1fr, gap 8]` (phone: 1 column, gap 48)
    - CardLink `a[flex col]` > Desktop[flex col gap 20]
      - Media[aspect 1.33/1, overflow clip, width 100%] > img cover
      - Wrap[flex col gap 16, width 315 (max-width 90%)]: date p (Spline Sans Mono 10/16 uppercase #121212) + h5 (Geist 18/22.5 500 ls -.72 #121212; phone/768: 16/20 ls -.64)

## Geometry @1440
- section y 6919 h 871; label y 7079; h3 x 520 w 912; grid y 7269, cards 350×360, images 350×263; date y 7553; title y 7585

## Items
1. 08.06.2026 — "Anode reaches 1.4 GWh of contracted storage across ERCOT" — /news/anode-1-4-gwh-contracted — `news-desert-road.webp`
2. 08.02.2026 — "Cedar Bayou energizes fourteen months after interconnection" — /news/cedar-bayou-energised — `news-dam.webp`
3. 07.27.2026 — "Anode publishes its first annual fleet availability report" — /news/first-fleet-availability-report — `solution-systems.webp`
4. 07.27.2026 — "Dispatch adds day-ahead co-optimization across every site" — /news/dispatch-day-ahead — `solution-deployment.webp`

## Responsive
- Phone: single column, images 374×281, title 16/20.
