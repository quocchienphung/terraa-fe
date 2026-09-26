# Earth textures — provenance

Built by `scripts/build-earth-textures.py` (Python 3.11, Pillow 12.2, NumPy 2.4) on 2026-09-26.
All maps are equirectangular (plate carrée), 2:1, longitude −180° at the left edge, latitude +90° at
the top — the convention three.js `SphereGeometry` UVs expect (checked in `tests/globe-geo.test.ts`).
Sources are downloaded once into `.cache/earth-sources/`; nothing is hotlinked at runtime.

## Processed files

GPU memory is an estimate: browsers upload decoded images as RGBA8, plus a full mip chain (×4/3).

| File | Size | Bytes | Compression | Colour space | Content | Est. GPU |
| --- | --- | --- | --- | --- | --- | --- |
| `earth-albedo-4k.webp` | 4096×2048 | 606,404 | WebP lossy q88 | sRGB | Surface colour, July 2004, **no baked relief** | 42.7 MiB |
| `earth-albedo-2k.webp` | 2048×1024 | 176,326 | WebP lossy q88 | sRGB | Same, mobile tier | 10.7 MiB |
| `earth-night-4k.webp` | 4096×2048 | 101,286 | WebP lossy q82 | sRGB | City lights only (moonlit land/ice masked out, luminance smoothstep 48→140) | 42.7 MiB |
| `earth-night-2k.webp` | 2048×1024 | 24,492 | WebP lossy q82 | sRGB | Same, mobile tier | 10.7 MiB |
| `earth-clouds-4k.webp` | 4096×2048 | 1,841,594 | WebP lossy q80 (single channel; mean abs error 2.7/255, p99 11) | linear data | Cloud density; 180° seam cross-faded over 16 px | 42.7 MiB |
| `earth-clouds-2k.webp` | 2048×1024 | 471,828 | WebP lossy q80 (mean 2.7/255, p99 11) | linear data | Same, mobile tier | 10.7 MiB |
| `earth-relief-4k.webp` | 4096×2048 | 1,221,418 | WebP **lossless** | linear data | R = elevation (0–255 ≙ 0–6400 m, σ≈1 px blur against 25 m terraces), G = water mask (soft coast) | 42.7 MiB |
| `earth-relief-2k.webp` | 2048×1024 | 386,994 | WebP **lossless** | linear data | Same, mobile tier | 10.7 MiB |

Desktop loads the four `4k` files (3.60 MiB over the network, ≈171 MiB estimated GPU); mobile /
coarse-pointer loads the four `2k` files (1.01 MiB, ≈43 MiB). Only one tier is requested per visit.
8K was not used: 4K is already ≈1 texel per screen pixel at the centre of the 1440 px desktop globe.

## Sources

| Role | Source file | Pixels | Projection | Credit / licence |
| --- | --- | --- | --- | --- |
| Albedo | NASA Blue Marble: Next Generation, base map (no topography shading), July 2004 — <https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x21600x10800.jpg> | 21600×10800 | equirectangular | NASA Earth Observatory (Reto Stöckli) |
| Night lights | NASA Black Marble 2016, 3 km colour map — <https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg> | 13500×6750 | equirectangular | NASA Earth Observatory / NASA GSFC |
| Clouds | Solar System Scope, "8k_earth_clouds.jpg" — <https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg> (page: <https://www.solarsystemscope.com/textures/>) | 8192×4096 | equirectangular | **Solar System Scope, CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/). The page describes them as "a result of merging and adjusting large amount of geo-data, space photos and images from NASA's Blue Marble"; changes here: converted to one channel, downsampled, seam cross-faded, re-encoded. |
| Elevation | GEBCO_08 elevation rendering — <https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg> | 5400×2700 | equirectangular | NASA Earth Observatory (Jesse Allen) from GEBCO (British Oceanographic Data Centre) |
| Water mask | GEBCO_08 bathymetry rendering — <https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bathymetry/gebco_08_rev_bath_5400x2700.jpg> | 5400×2700 | equirectangular | as above |

Registration: albedo, night, elevation and water come from NASA products in the same grid; the
cloud map's low-resolution correlation with NASA's own Blue Marble clouds is 0.985, and clouds only
need to register with themselves (the surface samples coverage/shadow from the same file).

Superseded on 2026-09-26: `earth-day-*.webp` (Blue Marble *with* shaded topography — baked shadows
conflicted with dynamic lighting), `earth-masks-2k.webp` (clouds and water packed in one lossy file),
`earth-normal-2k.webp` (normal baked at 2K from 5400 px elevation).

## Credit and usage

- NASA media guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/, read 2026-09-26):
  NASA imagery is "generally not subject to copyright in the United States"; acknowledge NASA as the
  source; commercial use must not imply NASA endorsement.
- Solar System Scope clouds: CC BY 4.0 requires attribution in a reasonable manner and an indication
  of changes. This file provides both; **no on-page credit is shown yet** — decide where the site
  lists image credits.
- Not re-verified: the licence of the underlying GEBCO_08 grid (the files used are NASA renderings).
