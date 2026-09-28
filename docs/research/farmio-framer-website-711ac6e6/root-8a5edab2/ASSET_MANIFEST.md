# Asset manifest

Downloaded by `scripts/download-assets-farmio-framer-website-711ac6e6-shared.mjs` (every response checked for a non-HTML content type). PNG originals were converted by `scripts/convert-images-farmio-framer-website-711ac6e6-shared.py` to WebP q84 at about 2× their largest rendered width. Local root: `public/sites/farmio-framer-website-711ac6e6/shared/`.

| Local file | Source (`framerusercontent.com/images/…`) | Original | Local | Used in |
| --- | --- | --- | --- | --- |
| `images/logo.svg` | `ugabjNKN6DO4f5E9WynUJ77Z8w.svg` | 135×44 | same | header, footer |
| `images/hero-field.webp` | `w8BxcgOTdrnm1oAx9APIWHAr7Y.png` | 2880×1600 | 2880×1600 | hero background |
| `images/solution-precision.webp` | `zNmcQyo07DxCT3RJxPq6gaYORh0.png` | 1275×1614 | 900×1139 | solutions card 1 |
| `images/solution-management.webp` | `3jG5Dq23m4D3GRcwL5L9qpH3pgo.png` | 1275×1614 | 900×1139 | solutions card 2 |
| `images/solution-sustainable.webp` | `JAGzNWPJfggBCr1mBmpRz68ZHug.png` | 850×1532 | 850×1532 | solutions card 3 |
| `images/service-1-bg.webp` … `service-5-bg.webp` | `PvCp32…`, `o4O1rk…`, `Yn65LO…`, `kU1LyG…`, `znwoT9…` | 1440×1083 / 2160×1625 | ≤2160 | services panel backgrounds |
| `images/service-1.webp` … `service-5.webp` | `zlRjhL…`, `TsnDBz…`, `d8hLyj…`, `SNtFJx…`, `Rvme5h…` | 2720×2004 / 2040×1503 | 1400×1031 | services cards |
| `images/features-roots.webp` | `IPWo9z3eXexOEYGaQAQGTKE.png` | 2019×1608 | 1420×1131 | features |
| `images/gallery-1…7.webp` | `oYXjem…`, `7XKnGc…`, `6gwj2I…`, `w6fqwu…`, `DSmJZc…`, `XVYKmK…`, `DLRQ9d…` | 720–1083 wide | ≤800 wide | gallery mosaic (column order) |
| `images/team-{sarah-wilson,michael-brown,john-carter}.webp` | `tUo1rL…`, `O2xOHP…`, `pBNrv3…` | 1696×2128 / 1272×1596 | 900×1129 | team |
| `images/testimonial-{john-miller,hasan-ali,rahim-ahmed,amina-khatun}.webp` | `aqxH6V…`, `gZ8XM3…`, `R9XCyj…`, `Eub9U3…` | 936×873 / 624×582 | ≤800 | testimonials |
| `images/faq-drone.webp` | `oQHhmcHGOAYy6mYwmkX5upOaDcI.png` | 1296×1296 | same | FAQ |
| `images/cta-field.webp` | `JvFZfXaAfe9KTLVPyGYPaXnna0.png` | 1440×869 | same | CTA + footer background |
| `icons/feature-growth.svg`, `icons/feature-tools.svg` | inline data-URI SVGs of the Features icons | 28×30 | same | features |
| `videos/farming-in-motion.mp4` | `framerusercontent.com/assets/Np45wly46PBKqCGM0tXpdJqVAo.mp4` | 18.5 MB | same | hero media card |
| `favicon.svg`, `apple-touch-icon.png` | `tUtWFipl6qdHjA2F5yK6HmnJM3U.svg`, `J33JpKDxcoZBzWmjPItk3MfbXu8.png` | — | same | metadata |
| `src/app/fonts/BDOGroteskVariable.woff2` | `framerusercontent.com/assets/FcybOZJ2ipUdK2dQmwN3gFVAvuk.woff2` | 124 KB, wght 300–900, SIL OFL 1.1 | same | whole site |

Icons from CSS masks (button arrow, FAQ chevron, quote, phone, mail) were decoded from the reference and rebuilt as React components in `shared/icons.tsx`.

Retained assets from the previous site (unchanged): `public/textures/earth/**` (see its MANIFEST.md), `public/images/reference/globe-night.webp` (Earth poster/fallback), `public/3d tokyo/**`, `public/viewroom/**`.

Known asset limitation: the hero-card video is served at the reference's 18.5 MB. No H.264 encoder was available locally to shrink it (the bundled Playwright ffmpeg cannot read MP4).
