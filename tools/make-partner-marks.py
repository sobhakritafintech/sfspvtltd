#!/usr/bin/env python3
r"""
Build the lending-partner nameplates used in the logo marquee.

These are *typographic placeholders*, not the lenders' registered logos. They
keep the site visually complete without reproducing trademarked artwork.
Replace the SVGs in resources/partners/ with approved logo files when you have
written permission from each lender; keep the same file names.

Real logo files are already installed for the tied-up partners shown in the
footer band (SBI, IndiaFirst, Avanse, Yes Bank, Piramal, PNB, Equitas), so this
script skips files that already exist. Pass --force to regenerate placeholders.

Usage: python tools/make-partner-marks.py [--force]
"""

import sys

from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "resources" / "partners"

# name, file stem, hex colour
PARTNERS = [
    ("State Bank of India", "sbi", "#22409a"),
    ("Yes Bank", "yes-bank", "#004b87"),
    ("Canara Bank", "canara-bank", "#00539f"),
    ("Chola Finance", "chola-finance", "#d71920"),
    ("Truehome Finance", "truehome-finance", "#00857c"),
    ("Avanse", "avanse", "#5b2c83"),
    ("Punjab National Bank", "pnb", "#7b1e3b"),
    ("Equitas", "equitas", "#0072bc"),
    ("Piramal Finance", "piramal-finance", "#9b1b5a"),
    ("IDFC First Bank", "idfc-first-bank", "#9d1d27"),
    ("Aditya Birla Capital", "aditya-birla-capital", "#a6192e"),
]

TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 56" width="240" height="56" role="img" aria-label="{label}">
  <text x="120" y="36" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="{size}" font-weight="700" letter-spacing="0.4" fill="{colour}">{text}</text>
  <rect x="104" y="44" width="32" height="2.5" rx="1.25" fill="{colour}" opacity="0.35"/>
</svg>
"""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    force = "--force" in sys.argv
    for name, stem, colour in PARTNERS:
        text = name.upper()
        # Keep the wordmark inside the 240-unit viewBox.
        size = max(17, min(30, round(208 / (0.60 * len(text)))))
        svg = TEMPLATE.format(
            label=escape(name), text=escape(text), colour=colour, size=size
        )
        path = OUT / f"{stem}.svg"
        alternates = [OUT / f"{stem}{ext}" for ext in (".png", ".webp")]
        if not force and (path.exists() or any(p.exists() for p in alternates)):
            print(f"skip  {stem}  (file exists; --force to overwrite)")
            continue
        path.write_text(svg, encoding="utf-8")
        print(f"wrote {path.relative_to(ROOT)}  (font {size})")


if __name__ == "__main__":
    main()
