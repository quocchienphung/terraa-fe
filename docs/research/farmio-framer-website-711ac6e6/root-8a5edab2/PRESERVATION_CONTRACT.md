# Preservation contract

What had to survive the redesign, where it lives, and how it was checked.

## Logo ticker

| Contract | Where | Status |
| --- | --- | --- |
| Two independent tracks (logos 40 px/s, ruler 56 px/s), seamless wrap by run width | `TickerMotion` + `src/lib/ticker-math.ts`, `TICKER` in `motion-config.ts` | unchanged; measured 40.3 and 56.4 px/s |
| Scroll coupling (direction follows scroll) | `TickerMotion` | unchanged; direction flips after a scroll-down (QA) |
| Runs only near the viewport and on a visible tab; still with reduced motion | `TickerMotion` | unchanged; reduced-motion check: transform static |
| Fixed centre pointer + triangle; duplicate runs `aria-hidden` | `LogoTicker.tsx` (markup copied from `ClientTicker`) | kept |
| Hidden Pause/Play button revealed on keyboard focus | `TickerMotion` | kept (label "logo ticker") |

## Earth

| Contract | Where | Status |
| --- | --- | --- |
| Client-only WebGL chunk, mounted near the viewport; SSR poster as loading/error fallback | `WorldGlobe` (`next/dynamic`, `ssr:false`) + `useGlobeController` stage machine | kept |
| Day/night, city lights, cloud drift, relief, atmosphere, texture tiers | `create-earth-scene.ts`, `earth-config.ts`, `public/textures/earth/**` | untouched |
| Drag/trackball with inertia, steering, pointer capture, second-finger cancel, touch scroll gutters (`touch-action:none` only on the silhouette) | `EarthCanvas.tsx`, `trackball.ts`, `rotation-input.ts` | untouched; QA drag rotated to Europe; phone drag area inset 62px each side |
| Pins projected per frame, back-face hidden, card follows the pin (≥768) / docked (phone) | `useGlobeController.onProject/placeCard` (moved verbatim from `GlobalFootprint`) | kept; `CardLayout` option added (bottom reserve 96 for the Farmio legend) |
| Prev/next with focus tween, counter, Pause/Play (separate from hover/focus hold), keyboard focus-visible hold | `useGlobeController.select/holdHandlers` | kept; QA prev/next/pause pass |
| Sleep offscreen / hidden tab, resize, context loss → poster, disposal | `EarthCanvas.tsx` | untouched |
| Renderer clear colour = section background (no seam) | `BACKGROUND = "#0a0a0a"` = `farm-night` | kept |
| Dataset | `MAP_LOCATIONS` (`src/lib/constants.ts`) | unchanged coordinates/kinds; labelled "Sample locations · demo data"; neutral heading |

## Viewroom

| Contract | Status |
| --- | --- |
| One R3F Canvas / renderer / scene / camera for mesh and splat; Spark on R3F's renderer | engine files untouched |
| Orbit / Fly / Tour, reset, fullscreen, Escape handling, pose hand-off | untouched logic; QA: Tour bar, Fly pressed, Orbit back |
| Manifest/adapters/resolver/local bundle/drag & drop/Back to Tokyo, delayed blob revoke | `ViewroomShell` logic untouched (classes only); QA: sample switch to Gaussian PLY renders, Back to Tokyo ready |
| Lazy loading: homepage never loads Fiber/Spark/FBX/Tokyo; mesh path does not load the Spark library | production network check: `/` → only three.js (globe); `/viewroom` Tokyo → Fiber + FBX, Spark library absent (only the `"SparkRenderer"` name string in the viewer chunk) |
| Loading / error / unsupported / context-lost cards, retry, attribution, warnings, info/help | same components, restyled; Info shows "Source:" attribution |
| Menu input lock | `#site-menu[data-open]` always mounted by the Farmio `Header`; `useSiteMenuOpen` now also waits for the element if it mounts later; QA: data-open true while open, Escape closes and refocuses the toggle |
| Smooth scroll | single Lenis instance; `data-lenis-prevent` on the viewer container and scroll panels kept; header pauses Lenis while the menu is open |
| Expanded (non-native) fullscreen below the fixed header | offset updated to the Farmio header: 78px / 112px |

## Known limitations (unchanged by the redesign)

Draco/KTX2/Meshopt are not configured. Spark 2.2 limits apply (SPZ v4, some SOG variants). PLY meshes and point clouds are not PLY Gaussians. glTF Gaussian extensions are not faked as point clouds. `.splat`/`.ksplat` have no fixtures in the repo. See `docs/research/viewroom/IMPLEMENTATION.md`.
