# Design tokens — Farmio

All values are **measured** on https://farmio.framer.website/ (Chrome 154, 1440×900 / 768×1024 / 390×844, 2026-09-28) unless marked **proposed**. Implemented in `src/app/globals.css` (`--color-farm-*`, `fm-*` utilities).

## Colour (Framer tokens)

| Token | Value | Use |
| --- | --- | --- |
| `farm-ink` | `#04303b` | headings, links, button text, button hover fill |
| `farm-body` | `#3b3939` | body copy (the preset fallback `#656565` is never rendered) |
| `farm-lime` | `#e7f352` | CTA pills, feature icon discs |
| `farm-sand` | `#e3e4d4` | About / Services / Features / Gallery / Team sections, tags, open FAQ, card chips |
| `farm-mist` | `#f2f3ee` | Solutions / How it works / Testimonials sections |
| white | `#fff` | nav pill, FAQ section, footer card, step text cards |
| `farm-night` | `#0a0a0a` | token present in Farmio; used for the Earth section (**proposed** placement) |
| `#f3f3f3` | input fields (contact) |
| `#ff2244` | red token of the reference; used for Viewroom error status (**proposed**) |
| overlays | hero black 73%, services black 70%, CTA black 75%, solution cards `linear-gradient(#000 17.1%, rgba(4,48,59,0) 100%)` |
| outlines | FAQ items 1px `rgba(0,19,5,0.1)` inset; glass pills 1px `rgba(187,187,187,0.15)` + `blur(12px)` |

## Typography

One face: **BDO Grotesk Variable** (SIL OFL 1.1, wght 300–900). Framer reports `font-weight: 1000`, which is its variable-font sentinel. Every preset sets `"wght" 400`, so the implementation renders at 400. Only `salt` exists among the requested OpenType features (hero H1); the other feature tags are absent from the file.

| Utility | <768 | 768–1199 | ≥1200 | ≥1440 | line-height | tracking | wrap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fm-h1` | 38 | 48 | 62 | 62 | 115% | −0.03em / −0.06em from 768 | balance |
| `fm-h2` | 36 | 36 | 44 | 52 | 120% | −0.06em | balance |
| `fm-h3` | 28 | 34 | 42 | 42 | 120% | −0.06em | — |
| `fm-h4` | 26 | 30 | 32 | 32 | 120% | −0.06em | balance |
| `fm-h5` | 20 | 22 | 24 | 24 | 1.2em | −0.05em | balance (quotes: wrap) |
| `fm-h6` | 20 | 20 | 20 | 20 | 160% | −0.02em | — |
| `fm-p18/16/14/12` | 18/16/14/12 | = | = | = | 160/160/150/150% | −0.02em | balanced where the reference balances |

`text-wrap: balance` is what gives the reference its line breaks. There are no `<br>`s in its markup. Tailwind 4 drops a raw `text-wrap` declaration inside `@utility`, so the presets use `@apply text-balance`.

## Layout

| | Phone (<768) | Tablet (768–1199) | Desktop (≥1200) |
| --- | --- | --- | --- |
| Section side padding | 20 | 30 | 30 (container max 1320, centred) |
| Section vertical padding | 60 | 80 | 120 (varies per section, see specs) |
| Tag → heading gap | 16 | 20 | 20 |
| Heading → content gap | 40 | 46 | 52 |
| Header | 15/20 padding, 48px pill r20 | same | 32/30 padding, 64px pill r56 |

Breakpoints: Framer uses Desktop ≥1200, Tablet 768–1199, Phone ≤767, plus a 1440 text step. Mapped to Tailwind `md` (48rem), `desk` (75rem) and the new `fxl` (90rem). The older `tab` (810px) is untouched for the legacy/viewer code that uses it.

## Radii and controls

Buttons: 44px high, radius 42, padding 9/20, 16px label, 16×15 arrow. Nav links: radius 42, padding 11/18. Cards: 20 (tablet services 12, steps 16 below 1200). Chips: radius 20, padding 4/16, 12px. Inputs: radius 8, 44px.

## Motion

| Effect | Value |
| --- | --- |
| Button hover | lime → ink fill, text → sand, arrow pair slides 20px; ~0.6s (sampled: rgb(33,59,60) at 600ms), easing **proposed** `cubic-bezier(0.44,0,0.56,1)` |
| Nav link hover | white → ink pill, text white |
| Footer link hover | 1px ink underline grows from 2px to full width, text → ink |
| Heading reveal | per word, opacity 0 + blur(4px) → 1 / 0, ~0.55s, ~60ms stagger (sampled at 150/300/500/800ms) |
| Services | crossfade ~0.4s between 5 states, one per viewport of scroll |
| Testimonials | one card (767+24px) every ~2s start-to-start, ~1s slide, infinite |
| FAQ | single-open, height ~0.5s |
