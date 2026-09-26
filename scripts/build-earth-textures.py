"""
Build the equirectangular Earth textures used by the Where We Operate globe.

Downloads NASA source imagery (public-domain NASA Earth Observatory / GSFC products,
see public/textures/earth/MANIFEST.md) and writes resized WebP maps to
public/textures/earth/. Requires Python 3.10+, Pillow and NumPy.

    python scripts/build-earth-textures.py [--cache DIR]

All sources share the same projection: plate carrée, 2:1, longitude -180 at the
left edge, latitude +90 at the top edge.
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

EO = "https://assets.science.nasa.gov/content/dam/science/esd/eo"
SOURCES = {
    "day": f"{EO}/images/bmng/bmng-topography/july/world.topo.200407.3x5400x2700.jpg",
    "night": f"{EO}/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg",
    "clouds": f"{EO}/content-feature/bluemarble/images/cloud_combined_2048.jpg",
    "elevation": f"{EO}/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg",
    "bathymetry": f"{EO}/images/bmng/bathymetry/gebco_08_rev_bath_5400x2700.jpg",
}

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "textures" / "earth"


def fetch(name: str, cache: Path) -> Image.Image:
    url = SOURCES[name]
    path = cache / url.rsplit("/", 1)[1]
    if not path.exists():
        print(f"download {url}")
        urllib.request.urlretrieve(url, path)
    return Image.open(path)


def feather_seam(a: np.ndarray, width: int) -> np.ndarray:
    """Cross-fades the first/last `width` columns so the 180° meridian has no hard edge."""
    out = a.astype(np.float32).copy()
    left = out[:, :width].copy()
    right = out[:, -width:].copy()
    for i in range(width):
        t = 0.5 * (1 - i / width)  # 0.5 at the seam, 0 at `width` px in
        out[:, i] = left[:, i] * (1 - t) + right[:, width - 1 - i] * t
        out[:, -1 - i] = right[:, -1 - i] * (1 - t) + left[:, i] * t
    return out


def normal_map(elev: np.ndarray, strength: float) -> np.ndarray:
    """Tangent-space normal map from a height field (wraps horizontally)."""
    h = elev.astype(np.float32) / 255.0
    dx = (np.roll(h, -1, axis=1) - np.roll(h, 1, axis=1)) * 0.5
    up = np.vstack([h[:1], h[:-1]])
    down = np.vstack([h[1:], h[-1:]])
    dy = (down - up) * 0.5
    nx = -dx * strength
    ny = dy * strength
    nz = np.ones_like(h)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    rgb = np.stack([nx / length, ny / length, nz / length], axis=-1)
    return ((rgb * 0.5 + 0.5) * 255).clip(0, 255).astype(np.uint8)


def save(img: Image.Image, name: str, quality: int, manifest: dict) -> None:
    path = OUT / name
    img.save(path, "WEBP", quality=quality, method=6)
    manifest[name] = {"size": list(img.size), "bytes": os.path.getsize(path)}
    print(f"wrote {name} {img.size} {os.path.getsize(path) // 1024} KB")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default=str(ROOT / ".cache" / "earth-sources"))
    args = parser.parse_args()
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict = {}
    lanczos = Image.Resampling.LANCZOS

    day = fetch("day", cache).convert("RGB")
    for w, q in ((4096, 86), (2048, 84)):
        save(day.resize((w, w // 2), lanczos), f"earth-day-{w // 1024}k.webp", q, manifest)

    # Black Marble includes moonlit land/ice; keep only the city lights so the night side
    # does not glow uniformly when the map is used as an emissive layer.
    night = fetch("night", cache).convert("RGB")
    for w in (4096, 2048):
        rgb = np.asarray(night.resize((w, w // 2), lanczos), dtype=np.float32)
        lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        t = np.clip((lum - 48.0) / (140.0 - 48.0), 0.0, 1.0)
        lights = rgb * (t * t * (3 - 2 * t))[..., None]
        save(Image.fromarray(lights.clip(0, 255).astype(np.uint8), "RGB"), f"earth-night-{w // 1024}k.webp", 82, manifest)

    # Data maps (linear, non-colour): R = cloud density, G = water mask, B = unused.
    clouds = np.asarray(fetch("clouds", cache).convert("L").resize((2048, 1024), lanczos), dtype=np.float32)
    clouds = feather_seam(clouds, 24)
    # Land is 255 in the bathymetry map. Build the mask at full source resolution with a soft
    # coastline, then downsample, so the specular edge is anti-aliased instead of stair-stepped.
    bath_full = fetch("bathymetry", cache).convert("L")
    water_full = Image.fromarray((np.clip((255.0 - np.asarray(bath_full, dtype=np.float32)) / 6.0, 0, 1) * 255).astype(np.uint8))
    water = np.asarray(water_full.resize((2048, 1024), Image.Resampling.BOX).filter(ImageFilter.GaussianBlur(1.2)), dtype=np.float32)
    masks = np.stack([clouds, water, np.zeros_like(clouds)], axis=-1).clip(0, 255).astype(np.uint8)
    save(Image.fromarray(masks, "RGB"), "earth-masks-2k.webp", 88, manifest)

    elev = np.asarray(fetch("elevation", cache).convert("L").resize((2048, 1024), lanczos), dtype=np.float32)
    save(Image.fromarray(normal_map(elev, 6.0), "RGB"), "earth-normal-2k.webp", 88, manifest)

    (OUT / "manifest.json").write_text(json.dumps({"sources": SOURCES, "files": manifest}, indent=2) + "\n")


if __name__ == "__main__":
    main()
