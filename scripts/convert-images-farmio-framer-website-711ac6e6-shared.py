"""Converts the downloaded Farmio PNGs (scripts/download-assets-farmio-framer-website-711ac6e6-shared.mjs) to WebP at ~2x their
largest rendered width, then removes the PNG. Usage: python scripts/convert-images-farmio-framer-website-711ac6e6-shared.py"""
from pathlib import Path
from PIL import Image

DIR = Path(__file__).resolve().parent.parent / "public" / "sites" / "farmio-framer-website-711ac6e6" / "shared" / "images"
# Longest rendered width across breakpoints ×2 (retina), capped by the source size.
MAX_W = {
    "hero-field": 2880, "cta-field": 2880,
    "service-1-bg": 2160, "service-2-bg": 2160, "service-3-bg": 2160, "service-4-bg": 2160, "service-5-bg": 2160,
    "service-1": 1400, "service-2": 1400, "service-3": 1400, "service-4": 1400, "service-5": 1400,
    "solution-precision": 900, "solution-management": 900, "solution-sustainable": 900,
    "features-roots": 1420, "faq-drone": 1420,
    "team-sarah-wilson": 900, "team-michael-brown": 900, "team-john-carter": 900,
}
DEFAULT_W = 800  # gallery tiles and testimonial portraits

for png in sorted(DIR.glob("*.png")):
    im = Image.open(png)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    w = MAX_W.get(png.stem, DEFAULT_W)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    if im.mode == "RGBA" and im.getextrema()[3][0] == 255:
        im = im.convert("RGB")
    out = png.with_suffix(".webp")
    im.save(out, "WEBP", quality=84, method=6)
    print(f"{out.name:32} {im.width}x{im.height}  {out.stat().st_size // 1024} KB")
    png.unlink()
