# CTA (Pre-Footer) Specification

## Overview
- **Target file:** `.../root-8a5edab2/CTA.tsx`
- **Screenshot:** `ref-1440-sec9.png`
- **Interaction model:** time-driven decoration (rotating tick rings) + hover CTA

## DOM Structure
`section[flex col center, justify center, gap 10, padding 128px 0, bg #121212, overflow hidden, relative]`
- ContentWrap[z 1, flex col center, gap 32, padding 0 32, overflow hidden]
  - TextWrap[max-width 650] > h3 "Ready to build?" (Geist 48/55.2 ls -2.4 #fff center; phone 32/36.8 ls -1.6)
  - Wrap > ArrowCta green (200×56, padding 24px 12px 12px, bg #00e05c, color #121212, label Geist 14/14 600 ls -.14 "Start a Project", mask 20×20, sweep #fff, hover color #121212) → /contact
- decoration `div[absolute inset 0, z 0, overflow hidden]` — all centered at (left 50%, top 270px) via translate(-50%,-50%):
  - circles: 560×560 border 1px rgba(255,255,255,.08); 980×980 rgba(255,255,255,.06); 1500×1500 rgba(255,255,255,.043); radius 50%
  - tick ring A: 884×884 box (background-size contain) with generated svg 640×640: 96 ticks (3.75° step) stroke rgba(255,255,255,.22) width 1; major (every 8th) from r 300→318, minor r 302→315. animation `spin 80s linear infinite` (translate(-50%,-50%) rotate 0→360)
  - tick ring B: 1103×1103 box with svg 860×860: 64 ticks (5.625°) stroke rgba(255,255,255,.16); major (every 8th) r 419→428, minor r 422→426. animation `spin-r 130s linear infinite` (360→0)
  - corner brackets 14×14: at left 230.4 / right 230.4, top 75.6 / bottom 75.6 (i.e. 16% of width inset; use `left: calc(50% - 489.6px)`… simpler: inset 75.6px 230.4px → at 1440; use percentages: x 16%, y 14%); border 1px rgba(255,255,255,.18) on the two outer sides
  - rulers: `div[absolute top 0 bottom 0, width 8, left 0 | right 0, background repeating-linear-gradient(rgba(255,255,255,.2) 0 1px, transparent 1px 9px)]`

## Geometry @1440
- section y 7790 h 540; h3 y 7988; CTA y 8075 (620–820). Phone: h 506, h3 y+150.

## Text
"Ready to build?" · "Start a Project"
