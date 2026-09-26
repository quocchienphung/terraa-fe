# GlobalFootprint Specification (map)

## Overview
- **Target file:** `.../root-8a5edab2/GlobalFootprint.tsx`
- **Screenshot:** `ref-1440-sec5.png`
- **Interaction model:** time-driven (5s auto-cycle) + click-to-select + hover

## DOM Structure
`section[relative, height 800 (phone 640), bg #0a0a0a, overflow hidden, color #fff]`
- heading Row `[absolute, top 100, left 50%, translateX(-50%), width 1200, flex col center, gap 16, padding 0 24, z 1]`: SectionLabel "Global Footprint" (white text) + h3 "Where We Operate" (Geist 48/55.2 ls -2.4 center; phone 32/36.8 ls -1.6; max-width 800)
- `img.sat[absolute inset 0, cover, filter brightness(.62) saturate(.72) contrast(1.06)]` (globe-night.webp 2400×1350)
- `.shade[absolute inset 0, linear-gradient(180deg, rgba(10,10,10,.62) 0%, rgba(10,10,10,.12) 30%, rgba(10,10,10,0) 48%), linear-gradient(0deg, rgba(10,10,10,.55) 0%, rgba(10,10,10,0) 22%)]`
- 9 × `button.mk[absolute, left X%, top Y%, translate(-50%,-50%), 40×40, flex center, color rgba(255,255,255,.92), cursor pointer, z 2]`
  - active: color #00e05c; icon 17px instead of 14px; `span.ring.pulse` + `span.ring[opacity .55]` (absolute inset 5px, radius 50%, 1px solid #00e05c)
- `.card[absolute z 5, width 300, padding 20px 22px 22px, bg rgba(16,16,16,.42) + grid svg, border 1px rgba(255,255,255,.08), radius 12, backdrop-filter blur(28px) saturate(1.15)]` positioned `left: min(X%, 100% - 344px); top: max(Y%, 330px); transform: translate(26px, calc(-100% + 10px))`
  - kicker: Spline Sans Mono 9.5/11.4 ls .76 uppercase #b5b5b5, margin-bottom 10
  - name: sans-serif 15px 500 ls -.3 #fff; place: 13px #b5b5b5 margin-top 2; rule 1px rgba(255,255,255,.12) margin 14px 0; desc: 12.5px/18.75 rgba(255,255,255,.72)
- legend `[absolute left 56 right 56 bottom 24, flex space-between, align flex-end, wrap, gap 16, z 3]`: 3 items (flex gap 7, icon 12px, Spline Sans Mono 9.5px ls .57 uppercase rgba(255,255,255,.72)), gap 18; counter "02 / 09" same style.

## Marker data (left%, top%, kind, name, place, description)
0. 30 56 site "Bell Junction" "West Texas · ERCOT" "Standalone storage dispatching into ERCOT West. Containerized LFP, energized and operated by Anode from first dispatch."
1. 42 68 site "Cedar Bayou" "Gulf Coast, Texas · ERCOT" "Fourteen months from interconnection study to first dispatch. The enclosure Anode certified is the enclosure Anode operates."
2. 22 72 site "Marfa Flats" "Far West Texas · ERCOT" "Merchant storage running day-ahead co-optimization on Anode dispatch software, with degradation tracked block by block."
3. 36 46 site "Salt Fork" "Texas Panhandle · ERCOT" "Completed its first augmentation cycle with no measured capacity shortfall against the contracted curve."
4. 52 58 office "Dallas HQ" "Dallas, Texas" "Headquarters — development, engineering, and the operations desk that dispatches the fleet."
5. 47 78 office "Austin" "Austin, Texas" "Software and market operations — the team behind Argus and the bidding stack."
6. 66 44 dev "Rotterdam" "Netherlands · TenneT" "Grid-services storage in development with a European utility partner."
7. 82 72 dev "Adelaide" "South Australia · NEM" "Utility-scale storage in development in one of the world’s fastest-moving storage markets."
8. 62 88 dev "Santiago" "Chile · SEN" "Storage co-located with solar in development in the Chilean national grid."
Kicker per kind: site → "Operating site", office → "Office", dev → "In development".

## Icons
- site: 9 circles r1.4 (4,12)(8,12)(12,12)(16,12)(20,12)(12,4)(12,8)(12,16)(12,20) fill currentColor
- office: circle (12,12) r4.6 fill
- dev: circle (12,12) r5.4 stroke 1.8 no fill

## Behaviors
- `@keyframes pulse { 0% { transform: scale(.45); opacity: .9 } 100% { transform: scale(1.8); opacity: 0 } }` 2.4s cubic-bezier(.22,.61,.24,1) infinite
- card `@keyframes rise { from { opacity 0; translateY(8px) } to { opacity 1; translateY(0) } }` ~.35s on each change
- auto-advance every 5000ms; click sets active and restarts the timer. Hover: color #00e05c.

## Responsive
- Phone: height 640; card `left 12px; right 12px; bottom 44px; width auto; padding 15px 16px 16px; transform none`; legend inset 16px bottom 16px.
