# Implementation notes

## Run

```bash
npm run dev          # http://localhost:3000  (/ , /viewroom , /contact-us)
npm run check        # lint + typecheck + build (does not run tests)
npm test             # unit tests
```

Assets are committed. To re-fetch: `node scripts/download-assets-farmio-framer-website-711ac6e6-shared.mjs`, then `python scripts/convert-images-farmio-framer-website-711ac6e6-shared.py` (needs Pillow).

## Where things are

- `src/components/sites/farmio-framer-website-711ac6e6/shared/`
  - `content.ts`: all Farmio copy, links and media paths (edit copy here; source typos are kept for 1:1 comparison).
  - `Header.tsx`: fixed pill nav and mobile menu; owns the `#site-menu[data-open]` contract.
  - `PillButton.tsx`, `SectionTag.tsx`, `WordReveal.tsx`, `icons.tsx`.
  - `Faq.tsx`, `CtaFooter.tsx`: shared by `/`, `/contact-us` and `/viewroom` (footer only).
- `.../root-8a5edab2/`: homepage sections. `LogoTicker.tsx` and `WorldGlobe.tsx` are the retained features.
- `.../contact-us-0353b788/ContactSection.tsx`: contact block (mailto hand-off, no backend).
- `src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/globe/useGlobeController.ts`: globe interaction state shared by `WorldGlobe` and the legacy `GlobalFootprint`.
- `src/app/globals.css`: `--color-farm-*`, `--font-farmio`, `fxl` breakpoint, `fm-h1…fm-p12` presets, `.fm-btn`, `.fm-underline`, word-reveal keyframes. Legacy Anode tokens are untouched.

## Decisions worth knowing

- **Font:** BDO Grotesk Variable via `next/font/local`, weight 400 everywhere (Framer's `font-weight: 1000` is a sentinel). The old Google fonts were removed from the layout; nothing rendered uses them any more.
- **Balanced text:** the reference relies on `text-wrap: balance` for its line breaks. Tailwind 4 strips a raw `text-wrap` inside `@utility`, so the presets use `@apply text-balance`.
- **Hover colours on pills are utilities**, not `.fm-btn:hover`: component-layer rules lose to `bg-farm-lime`.
- **Services** is one DOM for all widths: sticky crossfade ≥768, list below. The active step is derived from scroll position (a viewport per step), matching the reference's scroll triggers.
- **Lenis** stays the single scroll driver (the reference uses it too). QA scripts must let a wheel-started Lenis animation settle before calling `window.scrollTo`.
- **Viewroom** is a derived design. Only presentation classes changed in the viewer components; engine files and `src/lib/viewroom/**` are untouched.
- Legacy Anode components (Header, MenuOverlay, Footer, sections) remain in the repo but are no longer rendered.

## Open follow-ups

- Replace the placeholder logos and the demo globe dataset with real partners/sites when available (both are labelled neutrally today).
- Fix the source typos in `content.ts` ("Ger started", "Receive ar to…") once 1:1 comparison is no longer needed.
- Re-encode `farming-in-motion.mp4` (18.5 MB) with an H.264 encoder.
