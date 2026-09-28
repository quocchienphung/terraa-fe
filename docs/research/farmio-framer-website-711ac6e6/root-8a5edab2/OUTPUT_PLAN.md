# Output plan — Farmio redesign

Date: 2026-09-28. Sources: https://farmio.framer.website/ (live, primary) and the Framer project (same design; the live site was used for every measurement).

## Keys and roots

| Item | Value |
| --- | --- |
| site-key | `farmio-framer-website-711ac6e6` (sha256("https://farmio.framer.website")[0:8]) |
| page-keys | `root-8a5edab2` (`/`), `contact-us-0353b788` (`/contact-us`) |
| Components | `src/components/sites/farmio-framer-website-711ac6e6/{shared,root-8a5edab2,contact-us-0353b788}/` |
| Assets | `public/sites/farmio-framer-website-711ac6e6/shared/{images,icons,videos}/`, favicon + apple icon in `shared/` |
| Font | `src/app/fonts/BDOGroteskVariable.woff2` (next/font/local needs it inside the app) |
| Research | `docs/research/farmio-framer-website-711ac6e6/root-8a5edab2/` |
| Screenshots | `docs/design-references/farmio-framer-website-711ac6e6/root-8a5edab2/` |
| Scripts | `scripts/download-assets-farmio-framer-website-711ac6e6-shared.mjs`, `scripts/convert-images-farmio-framer-website-711ac6e6-shared.py` |

## Routes

| Route | Before | After |
| --- | --- | --- |
| `/` | Anode homepage | Farmio homepage + retained logo ticker and Earth (replacement approved in the master prompt) |
| `/viewroom` | Anode-styled viewer page | Same viewer engine, Farmio presentation |
| `/contact-us` | — | New: target of every Farmio CTA (reference page), form without backend |

## Migration matrix

| File / area | Decision |
| --- | --- |
| `src/app/page.tsx` | **replace** composition with Farmio sections |
| `src/app/layout.tsx` | **replace** fonts (Geist, Spline/Fragment/PT Mono, Inter → BDO Grotesk local), metadata, favicon; **keep** `SmoothScroll` (Lenis — Farmio also runs Lenis) |
| `src/app/globals.css` | **add** Farmio tokens, `fm-*` text presets, button/underline/reveal styles, `fxl` breakpoint; **keep** every Anode token/utility (`.glass`, masks, keyframes used by the globe) |
| `src/app/viewroom/page.tsx` | **restyle** shell (Farmio header/footer, tag + H1, 20px frame) |
| `src/app/contact-us/page.tsx` | **add** |
| Anode `ClientTicker.tsx` | keep file, no longer rendered; replaced by Farmio `LogoTicker.tsx` which **reuses** `TickerMotion`, `MARQUEE_LOGOS`, `TICKER` |
| Anode `GlobalFootprint.tsx` | keep file (not rendered), **refactored** onto the new shared `globe/useGlobeController.ts` |
| Anode `globe/*` engine | **unchanged** (EarthCanvas, create-earth-scene, earth-config, trackball, rotation-input, project-markers) |
| `globe/useGlobeController.ts` | **add**: interaction/selection/projection state extracted verbatim from GlobalFootprint |
| Farmio `WorldGlobe.tsx` | **add**: Farmio chrome over EarthCanvas + useGlobeController |
| Other Anode section components, Header, MenuOverlay, Footer | keep, not rendered |
| `components/viewroom/ViewerHud, ViewerPanels, ViewerLoading, ViewerFallback, OpenModelMenu, ViewroomClient, ViewroomShell` | **restyle** classes only |
| `components/viewroom/TerraViewport.tsx` | **restyle** classes only (+ expanded-fullscreen offset for the new header height) |
| `components/viewroom/useSiteMenuOpen.ts` | **harden**: waits for `#site-menu` if it mounts later |
| `ViewerScene, CameraController, AssetRenderer, SparkProvider, DaylightRig, viewerHooks, viewerCommands`, `src/lib/viewroom/**` | **unchanged** |
| `public/**` existing assets, tests | **unchanged** |

## Integration decisions (not in the Farmio reference)

- Logo ticker after the hero, before About.
- Earth after Features, before How it works ("global impact" continuation).
- "Viewroom" added to the header (desktop links + mobile menu); active state = sand pill / underline.
- Viewroom page designed from Farmio tokens; it is not a clone of any Farmio page.

## Agent use

Work was done sequentially by the lead agent. All shared files (globals.css, layout, content, header/footer) have a single owner, and the per-section work depended on the same measured tokens, so parallel builders would have mostly re-derived the same extraction. Quality gates were applied the same way.
