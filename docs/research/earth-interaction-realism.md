# Earth interaction and realism — report

Date: 2026-09-26. Brief: `docs/prompts/earth-interaction-realism-claude-code.md`. Scope: the
Global Footprint / Where We Operate globe only. Visual evidence:
`docs/design-references/earth-interaction-realism/`. Every parameter below is a proposed, tuned
value — nothing was measured on Stripe, and nothing here simulates real weather or physics.

## 1. Causes found in the source (verified before changing it)

| Finding | Evidence | Consequence |
| --- | --- | --- |
| Canvas had `pointer-events-none` | `GlobalFootprint.tsx` | no pointer input possible |
| Speed clamped 0…1, `speed > 0` conditions | `EarthCanvas.tsx` | reverse rotation impossible |
| `clouds.rotation.y` advanced inside the surface branch × `speed` | `EarthCanvas.tsx` | clouds froze whenever the surface stopped |
| Surface read cloud coverage at a fixed `vUv` while the cloud mesh rotated | earth shader | city-light dimming drifted out of register with the visible clouds |
| Day map = Blue Marble **with shaded topography** + a 2K normal ×0.9 | build script, manifest | baked shadows plus dynamic relief; muddy terrain in close-ups (`before-1440-initial-closeup-himalaya.png`) |
| Clouds (R) and water (G) packed in one lossy WebP q88; clouds were NASA 2048 px | build script | soft/blurred clouds at ~3× magnification; two independent data channels shared lossy compression |
| One `spinning` boolean (`!paused && !hold && !reduced`) | `GlobalFootprint.tsx` | could not express pause vs UI hold vs steering vs drag |

## 2. Interaction

State owner: `EarthCanvas.tsx` frame loop writes orientation; pointer events only record input.
Pure logic (tested): `globe/rotation-input.ts`. Tunables: `INTERACTION`, `CLOUDS` in `globe/earth-config.ts`.

Priority each frame: **focus tween > drag > Pause > reduced motion > UI hold > release inertia > steering > idle**.

| State | Surface | Clouds | Input |
| --- | --- | --- | --- |
| Hidden tab / offscreen / WebGL error | loop stops (0 draw calls measured) | stops | steering and drag cleared; omega reset to idle (or 0 when paused/held); clock reset on wake |
| Pause button | eases to 0 (τ 0.12 s) | stops | hover ignored; explicit selection still tweens; a drag is a direct edit, no inertia, no auto-resume |
| Reduced motion | no auto-spin | no drift | no steering; selection instant; drag direct, no inertia |
| Focus tween (prev/next) | slerp owns the quaternion (1 s) | drifts | steering ignored during the tween; a drag rebases the tween to the on-screen orientation |
| Hover/focus on pin, card, control | eases to 0 (τ 0.08 s) | drifts | canvas gets `pointerleave`, so no steering through DOM overlays |
| Drag | yaw = Δx / (px per radian at the grabbed point) | drifts | pointer capture, 5 px threshold, touch only for horizontal gestures |
| Hover over the globe | signed target velocity | drifts | position-based, not event-based |
| Idle | 150 s/rev as before | drifts | — |

Steering (mouse/pen only, hit-tested with a ray–sphere test against the current framing):
`x ∈ [−1, 1]` from the globe centre line to its visible edge; dead zone ±0.12;
`multiplier = x < 0 ? 1 − 7·s : 1 + 5·s` with `s = smoothstep` of the distance beyond the dead
zone — idle speed at the centre, through zero on the left to −6×, up to +6× on the right.
`omega += (target − omega)(1 − e^(−dt/τ))`, τ 0.24 s towards a steer target, 0.45 s back to idle.

Drag: the px-per-radian of the grabbed surface point is measured once at press (projected
derivative, clamped 0.35–2 × radius) so that point follows the cursor instead of a fixed
radius-based gain (which moved the lower globe ≈1.2× faster than the pointer). Velocity is
exponentially smoothed (τ 50 ms); release hands it to inertia (0 if the pointer rested > 90 ms,
cap 3 rad/s), then τ 0.25 s for 0.7 s back to the steering/idle target. A drag over a pin never
triggers its click (capture keeps the click on the canvas). Cursor: `grab` over the globe,
`grabbing` while dragging. Hint (fine pointers, ≥1200 px): "Move left or right to steer · Drag to
explore" ("Drag to explore" under reduced motion). No keyboard steering control was added; the
existing prev/next and Pause buttons remain the keyboard path.

## 3. Textures

| Layer | Before | Limitation observed | After | Projection | Colour space | Compression | Licence / credit | Pixels (desktop / mobile) | Network (desktop / mobile) | Est. GPU (desktop / mobile) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Surface colour | BMNG July **topography-shaded** 5400 px → 4K/2K | baked shadows fight dynamic light | BMNG July **base** (no relief) from 21600 px → 4K/2K | equirect. | sRGB | WebP lossy q88 | NASA EO | 4096² ×½ / 2048² ×½ | 592 / 172 KB | 42.7 / 10.7 MiB |
| Night lights | Black Marble 2016 3 km, lights-only | none new | unchanged | equirect. | sRGB | WebP q82 | NASA EO | same | 99 / 24 KB | 42.7 / 10.7 MiB |
| Clouds | NASA 2048 px in packed lossy R | blurry when magnified; shared lossy file | Solar System Scope 8K → 4K/2K, own file | equirect. | data | WebP lossy q80, one channel, mean error 2.7/255 | SSS CC BY 4.0 | same | 1798 / 461 KB | 42.7 / 10.7 MiB |
| Relief | 2K normal map baked from GEBCO (lossy) | 2K only, baked strength | elevation (R) + water mask (G), normals computed in the shader | equirect. | data | WebP **lossless** | NASA EO / GEBCO | 4K / 2K | 1193 / 378 KB | 42.7 / 10.7 MiB |
| **Total** | 1.09 MiB / 0.66 MiB, ≈107 / 43 MiB GPU | | | | | | | | **3.60 / 1.01 MiB** | **≈171 / 43 MiB** |

Checks behind the choices: the SSS 8K clouds correlate 0.985 with NASA's own clouds at low
resolution (same imagery, not a different weather state) and carry 67 % more high-frequency energy
at 4K than the NASA 2048 px map upscaled — real detail, not an upscale. Cloud WebP quality was
chosen by measured error: q92 2.9 MB (1.3/255), q86 2.2 MB (2.0), **q80 1.8 MB (2.7)**, q72 1.5 MB
(3.5). Elevation is 8-bit (25 m steps); a σ≈1 px blur removes terracing. Full provenance and URLs:
`public/textures/earth/MANIFEST.md`; rebuild with `python scripts/build-earth-textures.py`.

## 4. Shading (approximations)

- **Relief**: slopes from four elevation taps one real texel apart (texel size from the loaded
  image, so 4K and 2K both work), converted to metres per metre at the sample's latitude,
  × vertical exaggeration 18, zero on water, faded near the poles. Tangent frame = east/north of the
  globe's own axis, so it follows spin and tilt.
- **Terminator**: `smoothstep(−0.12, 0.16, N·L)` on the geometric normal; relief only modulates
  lit areas, so mountains never glow on the night side.
- **Water**: normalised Blinn-Phong (shininess 90) × Schlick Fresnel × water mask × (1 − cloud).
- **Clouds**: density ramp 0.20–0.98, opacity `1 − e^(−1.9·density / max(μ, 0.35))` (longer path at
  grazing angles), faded to 0 over the last 0.18 of μ at the limb (no white ring), soft
  self-shading from the sunward neighbour, dark and less opaque on the night side.
- **Cloud clock**: `cloudYaw` advances at 2π/800 s whenever visible and not paused/reduced,
  independent of surface speed or direction. The surface samples coverage at `u − cloudYaw/2π`
  (sign verified against a rotated `SphereGeometry` in a unit test), with `RepeatWrapping` and no
  `fract()` so there is no mip seam.
- **Cloud shadow**: the same map sampled towards the sun, displaced by shell height × tan(zenith)
  (clamped near the terminator), darkening sunlit ground by up to 35 %. A UV-offset approximation,
  not ray-marched volumetrics.

## 5. Before / after (fixed conditions)

Captured with `prefers-reduced-motion: reduce` so orientation, sun, exposure and scroll entry are
identical: no auto-spin, instant focus. `compare-*.png` stack before over after.

| View | Result |
| --- | --- |
| 1440 initial / Himalaya close-up | Zagros, Himalaya, Tarim rim crisper and lit from the sun side; no double shadows; clouds show filaments instead of blur |
| 1440 Santiago (Andes) | Andes relief reads; cyclone in the South Atlantic is sharp |
| 1440 Dallas | Rockies relief; Texas pins and card in the same place as before |
| 390 / 2560 initial | crop, title and card layout unchanged |
| Held-surface sequence (`after-held-clouds-t0/t10/t20s`, `…-sequence.png`) | pin fixed at (346.1, 319.2) px for 20 s while cloud pixels changed (mean Δ 178/765) — clouds move relative to the ground |

## 6. Checks run

Browser: Chrome 154 headless (ANGLE D3D11), i7-14700K + RTX 4070 SUPER. Surface speed was
measured by image correlation of a strip across the globe (px/s, + = rightward).

| Check | Result |
| --- | --- |
| Idle, pointer off the globe | 30.9 px/s (unchanged direction and period) |
| Centre / +0.10 (dead zone) | 30.7 / 30.7 px/s |
| Left 0.30 / 0.50 / edge 0.95 | 6.7 / −55.5 / ≈ −5.6…−5.8× idle (design: 7.4 / −55.5 / −5.9×) |
| Right 0.50 / 0.75 / edge 0.95 | 92.9 / 146 / ≈ +5.8× idle |
| Pointer still vs wiggling ±25 px at the same x | 93.3 vs 92.5 px/s (no event-rate spikes) |
| Black background, title text | idle, cursor not `grab` |
| Leave after hard-left steer | −109 px/s right after → 29 px/s after 1.8 s, no reset |
| Pause while reversing, pointer still at left edge | mean pixel change 0.000 over 1.5 s (surface and clouds) |
| Drag while paused | moves once, then 0 px/s (no resume) |
| Press without moving | 0 px shift |
| Slow drag +100 px | grabbed surface moved 98 px |
| Drag −200 px | −201 px (and −195 in a repeat) |
| Drag back +300 px | confirmed visually (cloud feature moved ≈ +300 px, `spin` +0.43 rad); strip correlation fails here because the fixed terminator dominates |
| Fling | 537 px/s in the first 250 ms → 63 px/s after 1.2 s (settling to idle) |
| Drag out of the canvas, release outside | cursor reset, idle speed |
| Drag released over a pin / plain click | not selected / selected |
| Next while steering hard left | on-screen target selected without a tween; off-screen targets land at (777.6, 480) as before |
| Tab hidden 2 s → visible | 3 px jump (one frame); speed back to idle (stale steering cleared) |
| Touch 390×844 (emulated) | horizontal swipe rotates, page does not scroll; vertical swipe scrolls natively (+316 px), globe does not rotate |
| Reduced motion | pointer at left edge: no motion; drag moves once, no inertia |
| Draw calls | ≈500/s visible (idle and held — clouds drift), 0 offscreen |
| Production frame time (`next start`) | 1440×900 idle/steer/drag: 165 fps, p95 6.2–6.3 ms; 2560×1000 same (one 12 ms frame); 390×844 DPR 3 emulated: p95 6.3 ms |
| ±180° seam | globe dragged until the Pacific date line was near the centre (`after-seam-pacific-180.png`): no visible seam in ocean, clouds or glint |
| Console | no WebGL/shader/hydration errors |
| `npm test` | 24/24 (13 new: mapping, dead zone, continuity, caps, 60/120/144 Hz damping equivalence, negative rotation, inertia return, priority, release velocity, drag delta, steering normalisation, cloud UV offset on `SphereGeometry`) |
| `npm run check` | lint, typecheck, build pass |

## 7. Files

- `globe/rotation-input.ts` (new) — steering mapping, damping, priority, drag/inertia helpers.
- `globe/EarthCanvas.tsx` — input state machine, ray–sphere hit test, drag with capture, weather clock, stale-input clearing.
- `globe/create-earth-scene.ts` — new surface/cloud shaders, 4 textures per tier, `setCloudYaw`.
- `globe/earth-config.ts` — `INTERACTION`, `CLOUDS`, new texture paths and look parameters.
- `GlobalFootprint.tsx` — `paused`/`held` props, canvas receives pointer input (`touch-pan-y`), overlays made pointer-transparent except controls, hint line.
- `scripts/build-earth-textures.py`, `public/textures/earth/*` (+ `MANIFEST.md`, `manifest.json`).
- `tests/rotation-input.test.ts` (new).

## 8. Not verified

- Real phones/tablets (touch was CDP emulation), real 60/120 Hz displays, Safari/Firefox, trackpads.
- Frame time on weaker GPUs; the desktop tier now needs ≈171 MiB of estimated texture memory
  (was ≈107 MiB) and 3.6 MiB of downloads (was 1.1 MiB).
- Cloud shadow and night-light registration were checked by the offset unit test and visually on
  captures; there is no pixel-exact test of the shadow direction.
- WebGL context loss in practice; screen-reader output of the new hint.
- On-page attribution for the CC BY 4.0 cloud map (credit is only in `MANIFEST.md`).
