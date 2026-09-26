# Earth textures — provenance

Built by `scripts/build-earth-textures.py` (Python 3.11, Pillow 12.2, NumPy 2.4) on 2026-09-26.
All maps are equirectangular (plate carrée), 2:1, longitude −180° at the left edge, latitude +90° at
the top — the convention three.js `SphereGeometry` UVs expect (checked in `tests/globe-geo.test.ts`).
Source files were downloaded once; nothing is hotlinked at runtime.

| File | Size | Bytes | Colour space | Content | Source |
| --- | --- | --- | --- | --- | --- |
| `earth-day-4k.webp` | 4096×2048 | 495,784 | sRGB | Surface albedo with shaded relief, July 2004 | Blue Marble: Next Generation + Topography, `world.topo.200407.3x5400x2700.jpg` (5400×2700) |
| `earth-day-2k.webp` | 2048×1024 | 137,960 | sRGB | Same, mobile tier | same |
| `earth-night-4k.webp` | 4096×2048 | 101,286 | sRGB | City lights only (moonlit land/ice masked out by luminance, smoothstep 48→140) | Black Marble 2016 color map 3 km, `BlackMarble_2016_3km.jpg` (13500×6750) |
| `earth-night-2k.webp` | 2048×1024 | 24,492 | sRGB | Same, mobile tier | same |
| `earth-masks-2k.webp` | 2048×1024 | 410,822 | linear data | R = cloud density (180° seam cross-faded over 24 px), G = water mask (soft coastline), B = unused | Blue Marble (2002) clouds `cloud_combined_2048.jpg` (2048×1024); water from GEBCO_08 bathymetry `gebco_08_rev_bath_5400x2700.jpg` |
| `earth-normal-2k.webp` | 2048×1024 | 105,676 | linear data | Tangent-space normal map (x = east, y = north), strength 6 | GEBCO_08 elevation `gebco_08_rev_elev_5400x2700.jpg` |

Desktop loads `day-4k`, `night-4k`, `masks-2k`, `normal-2k` (≈1.09 MB); mobile loads the `2k` day/night
instead (≈0.66 MB). Only one tier is requested per visit. 8K was not needed at the rendered sizes.

## Source URLs

- Day: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/july/world.topo.200407.3x5400x2700.jpg
  (listed on https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography/)
- Night: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg
  (listed on https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps)
- Clouds: https://assets.science.nasa.gov/content/dam/science/esd/eo/content-feature/bluemarble/images/cloud_combined_2048.jpg
  (listed on https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/)
- Elevation / bathymetry: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg,
  https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bathymetry/gebco_08_rev_bath_5400x2700.jpg
  (listed on https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/)

## Credit and usage

- Credit: **NASA Earth Observatory** (Blue Marble: Next Generation by Reto Stöckli; Black Marble 2016;
  Blue Marble clouds by Reto Stöckli / Robert Simmon, NASA GSFC). Topography and bathymetry imagery by
  NASA Earth Observatory (Jesse Allen) from **GEBCO** data (British Oceanographic Data Centre).
- NASA media guidelines (https://www.nasa.gov/nasa-brand-center/images-and-media/, read 2026-09-26):
  NASA imagery is "generally not subject to copyright in the United States"; acknowledge NASA as the
  source; commercial use must not state or imply NASA endorsement.
- Not re-verified in this session: the licence terms of the underlying GEBCO_08 grid (the images used
  here are NASA's renderings). Keep the GEBCO credit above.
