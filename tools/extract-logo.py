#!/usr/bin/env python3
r"""
Extract the Sobhakrita emblem from the flat brand artwork and build the web
assets used by the site.

Usage:
    python tools/extract-logo.py

Reads:   resources/brand/source-logo-flat.jpg
Writes:  resources/brand/logo-mark.png
         resources/brand/favicon-32.png
         resources/brand/apple-touch-icon.png
         resources/brand/icon-192.png
         resources/brand/icon-512.png

The source sheet contains the logo on a black panel (top) and a white panel
(bottom). We use the white version, key out the paper-white background to
transparency, and keep the light-grey elements opaque so the mark reads on
both the cream header and the navy footer.

Requires Pillow and numpy:  python -m pip install pillow numpy
"""

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "resources" / "brand"
SOURCE = BRAND / "source-logo-flat.jpg"

# Emblem only (above the wordmark) on the white panel, with breathing room.
CROP = (535, 1920, 2065, 3140)

# Paper tone used behind the square app icons.
PAPER = (251, 246, 236)


def key_out_white(img: Image.Image) -> Image.Image:
    """Turn the paper-white background into transparency.

    Alpha is derived from the minimum channel, with a soft threshold so
    anti-aliased edges stay smooth. Light greys (the car, the F/E blocks and
    the climbing figure) remain opaque.
    """
    a = np.asarray(img).astype(np.float32)
    mn = a.min(axis=2)
    alpha = np.clip((255.0 - mn - 6.0) / 24.0, 0.0, 1.0)
    rgba = np.dstack([a.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    out = Image.fromarray(rgba, "RGBA")
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source image: {SOURCE}")

    emblem = key_out_white(Image.open(SOURCE).convert("RGB").crop(CROP))

    # Wide mark for the header and footer (2x the largest CSS display size).
    mark = emblem.copy()
    mark.thumbnail((720, 720), Image.LANCZOS)
    mark.save(BRAND / "logo-mark.png", optimize=True)

    # Square icons sit on the site's paper tone.
    def square(size: int, padding: float, name: str) -> None:
        canvas = Image.new("RGB", (size, size), PAPER)
        inner = int(size * (1 - padding * 2))
        art = emblem.copy()
        art.thumbnail((inner, inner), Image.LANCZOS)
        canvas.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
        canvas.save(BRAND / name, optimize=True)

    square(512, 0.08, "icon-512.png")
    square(192, 0.08, "icon-192.png")
    square(180, 0.09, "apple-touch-icon.png")
    square(32, 0.04, "favicon-32.png")

    for name in ("logo-mark.png", "favicon-32.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png"):
        p = BRAND / name
        print(f"wrote {p.relative_to(ROOT)}  {p.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
