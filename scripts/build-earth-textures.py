"""
Build the equirectangular Earth textures used by the Where We Operate globe.

Downloads the source imagery once (NASA Earth Observatory / GSFC products and the Solar System
Scope cloud map, see public/textures/earth/MANIFEST.md) and writes WebP maps to
public/textures/earth/. Requires Python 3.10+, Pillow and NumPy.

    python scripts/build-earth-textures.py [--cache DIR]

All sources share the same projection: plate carrée, 2:1, longitude -180 at the left edge,
latitude +90 at the top edge. Colour maps are lossy WebP; data maps that the shader reads as
numbers (elevation, water mask) are lossless WebP. The cloud map is a single photographic
channel stored lossy; its error against the resized source is printed and recorded.
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
    # Blue Marble: Next Generation, July 2004, base map WITHOUT shaded relief (lighting is dynamic).
    "albedo": f"{EO}/images/bmng/bmng-base/july/world.200407.3x21600x10800.jpg",
    "night": f"{EO}/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg",
    # Solar System Scope 8K clouds (CC BY 4.0), derived from NASA Blue Marble clouds.
    "clouds": "https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg",
    "elevation": f"{EO}/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg",
    "bathymetry": f"{EO}/images/bmng/bathymetry/gebco_08_rev_bath_5400x2700.jpg",
}
TIERS = ((4096, "4k"), (2048, "2k"))

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "textures" / "earth"
LANCZOS = Image.Resampling.LANCZOS


def fetch(name: str, cache: Path) -> Image.Image:
    url = SOURCES[name]
    path = cache / url.rsplit("/", 1)[1]
    if not path.exists():
        print(f"download {url}")
        request = urllib.request.Request(url, headers={"User-Agent": "terraa-fe texture build"})
        with urllib.request.urlopen(request) as response, open(path, "wb") as out:
            out.write(response.read())
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


def gpu_mib(size: tuple[int, int]) -> float:
    """RGBA8 upload with a full mip chain (browsers upload decoded images as RGBA8)."""
    return round(size[0] * size[1] * 4 * 4 / 3 / 2**20, 1)


def save(img: Image.Image, name: str, manifest: dict, *, lossless: bool, quality: int = 90, **meta: object) -> Path:
    path = OUT / name
    if lossless:
        img.save(path, "WEBP", lossless=True, quality=100, method=6, exact=True)
    else:
        img.save(path, "WEBP", quality=quality, method=6)
    manifest[name] = {
        "size": list(img.size),
        "bytes": os.path.getsize(path),
        "compression": "webp-lossless" if lossless else f"webp-lossy-q{quality}",
        "estimatedGpuMiB": gpu_mib(img.size),
        **meta,
    }
    print(f"wrote {name} {img.size} {os.path.getsize(path) // 1024} KB")
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default=str(ROOT / ".cache" / "earth-sources"))
    args = parser.parse_args()
    cache = Path(args.cache)
    cache.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict = {}

    albedo = fetch("albedo", cache).convert("RGB")
    for w, tag in TIERS:
        save(albedo.resize((w, w // 2), LANCZOS), f"earth-albedo-{tag}.webp", manifest, lossless=False, quality=88,
             colorSpace="srgb", content="surface colour, no baked relief", source="albedo")

    # Black Marble includes moonlit land/ice; keep only the city lights so the night side
    # does not glow uniformly when the map is used as an emissive layer.
    night = fetch("night", cache).convert("RGB")
    for w, tag in TIERS:
        rgb = np.asarray(night.resize((w, w // 2), LANCZOS), dtype=np.float32)
        lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        t = np.clip((lum - 48.0) / (140.0 - 48.0), 0.0, 1.0)
        lights = rgb * (t * t * (3 - 2 * t))[..., None]
        save(Image.fromarray(lights.clip(0, 255).astype(np.uint8), "RGB"), f"earth-night-{tag}.webp", manifest, lossless=False, quality=82,
             colorSpace="srgb", content="city lights only", source="night")

    # Clouds: one channel, independent of every other map (drifts on its own clock).
    clouds_src = fetch("clouds", cache).convert("L")
    for w, tag in TIERS:
        ref = feather_seam(np.asarray(clouds_src.resize((w, w // 2), LANCZOS), dtype=np.float32), 16)
        img = Image.fromarray(ref.clip(0, 255).astype(np.uint8), "L")
        path = save(img, f"earth-clouds-{tag}.webp", manifest, lossless=False, quality=80,
                    colorSpace="linear-data", content="cloud density (single channel)", source="clouds")
        decoded = np.asarray(Image.open(path).convert("L"), dtype=np.float32)
        err = np.abs(decoded - ref.clip(0, 255))
        manifest[path.name]["lossyError"] = {"meanAbs": round(float(err.mean()), 3), "p99Abs": float(np.percentile(err, 99))}
        print(f"  cloud lossy error mean {err.mean():.3f} p99 {np.percentile(err, 99):.1f} (0-255)")

    # Relief: R = elevation (0-255 ≙ 0-6400 m, GEBCO_08), G = water mask. Lossless, because the
    # shader differentiates elevation and thresholds water.
    elev_src = fetch("elevation", cache).convert("L")
    bath_src = fetch("bathymetry", cache).convert("L")
    # Land is 255 in the bathymetry map; soft coastline at full resolution, then downsample.
    water_full = Image.fromarray((np.clip((255.0 - np.asarray(bath_src, dtype=np.float32)) / 6.0, 0, 1) * 255).astype(np.uint8))
    for w, tag in TIERS:
        # Light blur (σ≈1 px) hides the 25 m quantisation terraces of the 8-bit source.
        elev = np.asarray(elev_src.resize((w, w // 2), LANCZOS).filter(ImageFilter.GaussianBlur(1.0)), dtype=np.float32)
        water = np.asarray(water_full.resize((w, w // 2), Image.Resampling.BOX).filter(ImageFilter.GaussianBlur(1.0)), dtype=np.float32)
        rgb = np.stack([elev, water, np.zeros_like(elev)], axis=-1).clip(0, 255).astype(np.uint8)
        save(Image.fromarray(rgb, "RGB"), f"earth-relief-{tag}.webp", manifest, lossless=True,
             colorSpace="linear-data", content="R elevation 0-6400 m, G water mask", source="elevation+bathymetry")

    (OUT / "manifest.json").write_text(json.dumps({"sources": SOURCES, "files": manifest}, indent=2) + "\n")


if __name__ == "__main__":
    main()
