# Services — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/Services.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/compare/1440-services.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/services-1440-step3.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/reference/services-crossfade-strip.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- ≥768: section 500vh, sand; inner panel sticky `top: 40px`, 100svh, padding 80/30. Five stacked background photos (black 70%) and five stacked cards; the active index = floor(scroll into the section / viewport height); 400ms opacity crossfade.
- Heading (tag + H2 white, max 625, balanced, gap 10) is rendered once over the crossfade. The reference crossfades a duplicate heading that is 10px lower in panels 3–5.
- Card: 655 (desktop) / 585 (tablet), sand, radius 20 / 12, padding 12/12/24, gap 24; image 339 / 330 high; H4 ink + 20px body (balanced; max 400 for items 1–2, 552 for 3–5).
- Progress "0N/05" (05 at 50%) + "[ Keep Scrolling ]" 20px white: beside the card's bottom edge (+20px) on desktop, centred below (30px) on tablet.
- <768: no sticky/backgrounds; ink heading, list of cards (350, sand, 1px mist outline, radius 20, image 326×210 radius 12, H4 26px, gap 24).
