# LogoTicker — spec

- **Target:** `src/components/sites/farmio-framer-website-711ac6e6/root-8a5edab2/LogoTicker.tsx`
- **Screenshots:** `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/ticker-1440.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/qa/ticker-390.jpg`, `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/baseline-before-redesign/ticker-1440.jpg`
- Values measured on the live reference unless marked proposed; see ../DESIGN_TOKENS.md.

## Spec

- Retained, not in Farmio. White section, padding 60/80/100 (phone/tablet/desktop, **proposed**).
- Caption pill: mist bg, 14px ink, "Technology for every growing season" (neutral: the marks are placeholder logos).
- Unchanged structure and engine: 22px logo track (4 × MARQUEE_LOGOS per run, 90px gap, two runs), ruler track 28px below (120 ticks, 29px gap, every 5th 18px), fixed 2×22 centre pointer + triangle. `TickerMotion` drives both tracks (40 / 56 px/s, scroll-coupled).
- Only colours changed: ink `#04303b` instead of `#121212`.
