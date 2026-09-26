# Motion upgrade — implementation report

Date: 2026-09-26. Brief: `docs/prompts/anode-motion-threejs-agent.md`. Evidence for every
"measured" value: `MOTION_AUDIT.md`. Screenshots and frame sequences: `docs/design-references/motion-upgrade/`.

## Architecture and ownership

| Concern | Owner | Driver |
| --- | --- | --- |
| Smooth scroll | `shared/SmoothScroll.tsx` (Lenis, `autoRaf`) — the only `lenis.raf` driver | Lenis internal rAF |
| Reduced motion (live) | `src/hooks/use-reduced-motion.ts` (`useReducedMotion`, `watchReducedMotion`) | `matchMedia` change events |
| Line reveals | `shared/RevealText.tsx` + `src/lib/split-lines.ts` | IntersectionObserver per line + Web Animations API |
| Ticker | `shared/TickerMotion.tsx` + `src/lib/ticker-math.ts` | one rAF loop for both tracks, only while near the viewport |
| Solutions dim | `root/Solutions.tsx` | scroll listener → one rAF, reads batched before writes |
| Globe WebGL | `root/globe/EarthCanvas.tsx` (loop, orientation), `create-earth-scene.ts` (renderer, materials, disposal), `project-markers.ts` (lat/lon, occlusion, projection), `earth-config.ts` (all tunables) | one rAF, only while visible, sleeps when nothing moves |
| Globe DOM (title, pins, card, legend, controls, selection) | `root/GlobalFootprint.tsx` | receives projected points per rendered frame via callback; writes transforms through refs (no React state per frame) |

No GSAP/ScrollTrigger or Motion was added: reveals are time-driven after a trigger, the only
scroll-driven properties (dim, ticker coupling, globe entry) are single-owner rAF writes, so a timeline
engine would have added a second driver without need. Added dependency: `three@0.186.1`
(`@types/three@0.186.0` dev). Page and layout stay Server Components; client islands are
`RevealText`, `TickerMotion`, `Solutions`, `GlobalFootprint` (already client) and the dynamically
imported `EarthCanvas` (`next/dynamic`, `ssr:false`, inside the client component as the repo guide
requires).

## Final parameters

Measured on the reference (reproduced):

- Reveal: per-line mask, `.14em` pad, `translateY(130%)` → 0, **750 ms `cubic-bezier(0.25,1,0.5,1)`**,
  **110 ms** stagger for lines entering together, trigger when the mask is 20 px inside the viewport,
  plays once, split DOM removed afterwards. Applied to exactly the elements that have it on the
  reference: hero supporting paragraphs, What We Do statement, Our Solutions, Where We Operate,
  Featured Projects. Hero h1/h5, News, CTA stay static (reference has no reveal there).
- Ticker: logos **40 px/s**, ruler **56 px/s**, scroll-coupled (direction follows scroll direction and
  persists; speed × (1 + scroll px/s ÷ 80)). `TICKER.scrollCoupling = false` gives pure autoplay.
- Solutions dim: `0.42 × smoothstep(1 − nextTop / coveredRowHeight)`.

Proposed (no reference measurement; all in `globe/earth-config.ts`):

- Rotation 150 s/rev (`ω·dt`, dt clamped to [0, 100 ms]); clouds +1 turn / 1400 s; speed eases to 0 / 1
  with τ = 80 ms (≈ 250 ms); resume 1.5 s after pointer/keyboard focus leaves; focus tween 1000 ms
  (quaternion slerp, easeInOutCubic).
- Framing: desktop ≥1200 px diameter 0.9 × width capped at radius 1.05 × height, globe top at 25 %;
  768–1199 diameter 1.15, top 30 %; phones diameter 1.9, top 36 %. The height cap comes from the
  2560×1009 user screenshot (radius ≈ 1.04 × height). Camera FOV 24°, fitted analytically per size.
- Initial view: longitude 70°E, latitude 8° on the view axis (matches the poster's Eurasia/India view).
- Look: saturation 0.78, sun (view space) (0.9, 0.24, 0.1), day/night mask
  `smoothstep(-0.12, 0.16, N·L)` on the geometric normal, city lights 1.15 × (1 − daylight) × (1 − 0.7 ×
  cloud), specular 0.03 (exp 220) on water only, rim shell 1.012 R additive, haze 0.18, clouds at
  1.004 R, opacity 0.66. `NoToneMapping`, sRGB output, `#include <colorspace_fragment>`; day/night maps
  tagged sRGB, masks/normal left as linear data.
- Entry: scale 0.98 → 1 and 40 px → 0 view offset as the section scrolls in (easeOutCubic).
- Quality: desktop DPR ≤ 1.5, 96×64 segments, 4K day/night; mobile/coarse pointer DPR ≤ 1.25,
  64×48, 2K day/night. Scene mounts 700 px before the section; canvas crossfades in over 350 ms after
  textures upload, shaders compile (`compileAsync`) and the first frame renders.

## Deliberate differences from the reference

1. The static globe image is now a WebGL Earth (user request). The poster stays as SSR placeholder and
   failure fallback.
2. Marker auto-advance every 5 s was removed: the globe itself rotates, and jumping the camera across
   continents every 5 s would fight it. Selection stays until the visitor changes it; prev/next
   buttons (keyboard reachable) select all 9 locations; a Pause/Play button stops rotation.
3. Pins sit at real coordinates (`MapLocation.geo`), replacing the poster percentages that placed Texas
   sites on Asia. Offices use city-centre coordinates (`precision: "city"`); project sites have no
   published location and use a representative point of their named region (`precision:
   "approximate"`). `geo: null` is supported (listed, no pin).
4. Initial selection is Rotterdam (07/09) instead of 02/09, because it is the only location on screen in
   the poster-matching opening view.
5. A selected location that is on the far side is rotated to a point on the day side (54 % width, 60 %
   height on desktop); the tilt is kept until that pin rotates behind the limb, then eases back to the
   default composition while rotating.
6. Texas cluster: pins stay at true positions (they overlap at the default zoom); the active pin is
   raised above the others, and prev/next reaches each site. No leader-line offsetting was added.
7. The ticker keeps a visually hidden, keyboard-focusable Pause button (visible on focus) — WCAG 2.2.2;
   the reference has none.

## Other fixes

- Testimonials: the resize handler re-measured quote 0 after the quote had changed; it now uses a
  ResizeObserver with the current index, and phase timeouts/rAFs are tracked and cleared on unmount.
- Menu: opening it now stops Lenis (the page still scrolled under the overlay through Lenis); closing
  resumes it. Body overflow lock kept for the reduced-motion (no Lenis) case.
- Lenis now reacts to reduced-motion changes mid-session (destroyed/recreated).
- The hero, section heights and typography are unchanged: every section height is identical before and
  after at 1440×900 and 390×844 (scrollHeight 8934 / 10113 px both times).

## Assets

`public/textures/earth/` — NASA Blue Marble NG (July 2004, topography), Black Marble 2016, Blue Marble
clouds, GEBCO_08 elevation/bathymetry renderings. Provenance, sizes, bytes, credit and usage terms:
`public/textures/earth/MANIFEST.md`. Rebuild with `python scripts/build-earth-textures.py`.
NASA asks to be acknowledged as the source; the page does not show an on-screen credit yet.

## Checks run

| Check | Result |
| --- | --- |
| `npm run check` (eslint, tsc, next build) | pass |
| `npm test` — 11 tests: lat/lon ↔ SphereGeometry UV agreement for 4 cities, axis convention, spin-to-face, shortest angle across ±π, perspective occlusion vs naive z test, CSS-pixel projection, ticker wrap at the loop point, line grouping + hard breaks, dim curve vs reference samples | 11/11 pass |
| Reveal on local (Chrome, 1440×900) | trigger 0.968–0.978 × vh; fit 730–760 ms easeOutQuart; stagger 109 ms; single-line headings cleaned to plain text |
| Reload mid-page with a heading in view | 0 frames where the visible heading was hidden |
| Resize after partial reveal | text stays visible |
| Ticker on local | idle 39–40 / 54–56 px/s; scroll down → rightward boost then −40/−55 held; scroll up → leftward; offset wrap tested at the boundary |
| Solutions dim on local | 0.278@253, 0.361@153, 0.412@53 px (reference 0.281@250, 0.363@150, 0.413@50); reversible on scroll-up |
| Globe draw calls | ~500/s visible (3 draws × ~165 fps); **0** offscreen; **0** with `visibilityState = hidden`; **0** when paused |
| Tab hidden 2 s then visible | pin moved 2.2 px (one frame), no angle jump |
| Rotation rate independence | at ~141–165 Hz headless the pin moved 26.9–29.5 px/s, matching ω·R (≈ 27 px/s) for 150 s/rev; a per-frame increment would be ~2.5× faster. Real 60/120 Hz displays not tested |
| Next → Adelaide (far side) | after the 1 s tween the pin is at (777.6, 480.0) px vs target (0.54 × 1440, 0.6 × 800) = (777.6, 480); card anchored beside it; pin sits on Adelaide's coast in the screenshot |
| Hover card | rotation stops within ~250 ms; resumes 1.5 s after leaving |
| Keyboard | prev/next reach all locations; hidden pins have `tabindex=-1` + `aria-hidden`; visible pins focusable with a ring |
| Reduced motion (start and toggled mid-session) | no Lenis, ticker static, no split text, no spin, no pause button, selection still works (instant orientation) |
| Menu | Lenis `lenis-stopped` while open, wheel does not scroll; scroll works after Escape; body overflow restored |
| Testimonial next → resize | keeps quote 2 |
| Texture requests blocked | poster fallback, no pins, card docked, prev/next work |
| Production (`next start`) | three.js chunk (133 KB) and textures load only near the globe; desktop 4K tier ≈ 1.09 MB, mobile 2K tier ≈ 0.66 MB, never both; mobile DPR 3 → 487 px buffer for 390 px |
| Frame time (production, headless Chrome 154, i7-14700K + RTX 4070 SUPER, 1440×900 and 390×844 emulated) | rAF Δ p50 6.1 ms, p95 6.2–6.3 ms, max ≈ 12 ms |
| Console | no errors or hydration warnings (only Next's LCP hint when a test jumps straight to the globe, and the expected failed requests in the blocked-texture test) |

## Not verified

- Real phones/tablets and real 60/120 Hz displays (only viewport/DPR emulation on a desktop GPU); the
  "≥ 30 fps mobile" target is unmeasured.
- Touch fling and iOS Safari/Firefox behaviour (Chrome only).
- WebGL context loss in practice (handler falls back to the poster; not triggered in a test).
- Screen-reader output (structure checked: original text span stays readable, visual copy
  `aria-hidden`; no AT was run).
- Unmounting Testimonials in the middle of a transition (cleanup code in place, not exercised).
- GEBCO_08 licence terms beyond NASA's credit line.
- Video recording: frame sequences with timestamps were saved instead
  (`reveal-whatwedo-sequence.png`, `ticker-t0*.png`).
