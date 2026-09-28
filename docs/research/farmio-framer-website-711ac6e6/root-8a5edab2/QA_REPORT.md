# QA report — 2026-09-28

Environment: Windows 11, Node 22.14, Chrome (Playwright-core, headless, ANGLE D3D11). Dev server `next dev` on :3000 (already running) and production `next start` on :3100. Screenshot roots are relative to `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/`.

## Commands (final state)

| Command | Result |
| --- | --- |
| `npm run lint` | pass, 0 problems |
| `npm run typecheck` | pass |
| `npm test` | 75 / 75 pass (no tests added, removed or skipped) |
| `npm run build` | pass: `/`, `/contact-us`, `/viewroom` static |

Baseline before any change: lint 0 errors, typecheck pass, 75/75 tests, build pass.

## Visual comparison with the reference (`compare/`)

Reference (left) and local (right) at the same viewport, per section, at 1440×900, 768×1024 and 390×844: hero, about, solutions, services, features, how, gallery, team, testimonials, faq, cta. After fixes (balanced wrapping, FAQ outline/padding, dot pill, services heading width), the remaining differences are:

- The testimonial slideshow is time-based, so captures show different cards.
- Services: the heading is rendered once, not crossfaded with a copy 10px lower in panels 3–5.
- The reference's tablet variant says "120K+" for the first stat where desktop and phone say "12+". The clone uses "12+" everywhere.
- The Rahim Ahmed quote ends "…get better ." on desktop and "…get better yields." on phone in the reference. The clone uses the complete phone text.
- Deliberate: "Viewroom" link in the header. The ticker and Earth are additions (compared against the old baseline, not against Farmio).

No claim of pixel-perfection: font rasterisation, photo compression (WebP) and timing differ slightly.

## Behavior matrix (`qa-scripts/qa-home.mjs`, dev and production: 39 / 39 pass, no console errors)

- No horizontal overflow at 360, 390, 767, 768, 1199, 1200, 1440, 1920, 2560.
- Section order matches the plan.
- Ticker: logos 40.3 px/s, ruler 56.4 px/s; direction flips with scroll; pause control present; still under reduced motion.
- Earth: WebGL ready, pins on the front face, next/previous, Pause/Resume, drag area laid out, card shows the selection, drag rotates the globe (`qa/globe-1440-after-drag.jpg`). Phone: drag area inset 62px from both edges (scroll gutters), `touch-action:none` only on it.
- Services: all 5 states on the way down, correct state on the way up.
- FAQ: first open, single-open, closing the open item, all 6 questions open.
- Testimonials: autoplay advances; dot navigation.
- CTA hover fills ink (fixed during QA: utility-vs-component specificity).
- Navigation: `/viewroom` → header "About us" → `/#about` lands on the section; browser Back → `/viewroom`; hero CTA → `/contact-us`; contact form renders.
- Mobile menu: opens, link navigates and closes.
- Reduced motion: every heading word visible.

## Viewroom (`qa-scripts/vr.mjs`, `viewroom/`)

- 1440: Tokyo ready; Info panel (attribution present), Escape closes it; Help; Open-model menu lists Tokyo + 3 Guitar fixtures; Tour bar visible; Fly pressed; Orbit; Gaussian PLY sample renders (`1440-07-splat-sample.jpg`); Back to Tokyo ready; Fullscreen toggled.
- 390: Tokyo ready; panels and menu; header menu open → `#site-menu[data-open=true]`; Escape closes and focuses the toggle.
- First screen: the toolbar is fully visible at 1440×900 (bottom 855), 768×1024, 390×844 (bottom 809) and 1920×1080.
- No console errors or page errors.

## Bundles (production network)

- `/`: three.js only (globe). No Fiber, Spark, FBX loader or Tokyo/viewroom assets.
- `/viewroom` (Tokyo mesh): Fiber + FBX loader + Tokyo assets. The Spark library is not loaded; the only match is the `"SparkRenderer"` name string inside the viewer chunk.

## Not verified / limitations

- **Working-tree change not made by this task:** at 01:19 every file in `public/images/reference/` was deleted (uncommitted), while this task was running. Nothing in this task touches that folder. It was left as found. `globe-night.webp` in it is the Earth's SSR poster and error fallback (`MAP.image`). QA passed only because Next had the optimized poster cached. To restore just that file: `git checkout -- public/images/reference/globe-night.webp`.

- No real touch device. Touch was emulated (`hasTouch`, `isMobile`).
- The Framer editor was not used for measurements: the live site is the same design and was fully accessible.
- Local file/folder open and drag & drop were not re-run in this pass. That logic is unchanged (`ViewroomShell` classes only); the unit tests for format/PLY/resolver/tour/dispose/camera still pass.
- Context loss and WebGL-unavailable fallbacks were not re-triggered. The components are unchanged apart from styling.
- The hero-card video is 18.5 MB as served by the reference (no local H.264 encoder to shrink it).
- Frame rate was not measured for the Farmio sections (the dev overlay showed 140–165 fps in the viewer on this machine; not a guarantee).

## Reproducing

The scripts are in `qa-scripts/`: section comparison `compare.mjs`, behavior suite `qa-home.mjs`, Viewroom `vr.mjs` / `vrfit.mjs`, bundle check `bundles.mjs`, phone Earth `phone.mjs`, reference extraction `extract.mjs` / `presets.mjs`. They use `playwright-core` with the installed Chrome channel and `pngjs`, which are not project dependencies. They were run from `.cache/farmio/` with those packages installed there. Set `LOCAL=http://localhost:3100` to target a production server.
