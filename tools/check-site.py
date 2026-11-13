#!/usr/bin/env python3
"""Lightweight checks for the generated Sobhakrita static site.

Run from the project root:  python tools/check-site.py
No third-party dependencies.
"""
from __future__ import annotations

import os
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PageParser(HTMLParser):
    VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[tuple[str, str]] = []
        self.images: list[tuple[str | None, str | None]] = []
        self.symbols: set[str] = set()
        self.uses: list[str] = []
        self.stack: list[str] = []
        self.errors: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        if "id" in a and a["id"]:
            self.ids.append(a["id"])
        if tag == "symbol" and a.get("id"):
            self.symbols.add(a["id"])  # type: ignore[arg-type]
        if tag == "use" and a.get("href") and str(a["href"]).startswith("#"):
            self.uses.append(str(a["href"])[1:])
        for attr in ("href", "src"):
            if attr in a and a[attr]:
                self.links.append((tag, a[attr]))  # type: ignore[arg-type]
        if tag == "img":
            self.images.append((a.get("src"), a.get("alt")))
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID and self.stack and self.stack[-1] == tag:
            self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        if tag in self.VOID:
            return
        if tag in self.stack:
            while self.stack and self.stack[-1] != tag:
                self.errors.append(f"unclosed <{self.stack.pop()}> before </{tag}>")
            if self.stack:
                self.stack.pop()
        else:
            self.errors.append(f"stray </{tag}>")


def check_page(path: str) -> list[str]:
    problems: list[str] = []
    with open(path, "r", encoding="utf-8") as handle:
        text = handle.read()

    if re.search(r"\{\{[A-Z_]+\}\}", text):
        problems.append("unresolved build token")

    if '<main id="main">' not in text or "</main>" not in text:
        problems.append("missing main landmark")

    parser = PageParser()
    parser.feed(text)

    duplicates = [i for i, n in Counter(parser.ids).items() if n > 1]
    if duplicates:
        problems.append("duplicate id(s): " + ", ".join(sorted(duplicates)))

    if parser.errors:
        problems.extend(parser.errors[:5])
    if parser.stack:
        problems.append("unclosed tag(s): " + ", ".join(sorted(set(parser.stack))))

    missing_icons = sorted(set(parser.uses) - parser.symbols)
    if missing_icons:
        problems.append("icon(s) not in sprite: " + ", ".join(missing_icons))

    for src, alt in parser.images:
        if alt is None:
            problems.append(f"image without alt: {src}")

    for tag, link in parser.links:
        parsed = urlparse(link)
        if parsed.scheme or link.startswith(("#", "//")):
            continue
        target = parsed.path
        if not target:
            continue
        candidate = os.path.normpath(os.path.join(ROOT, target))
        if not os.path.exists(candidate):
            problems.append(f"{tag} target missing: {target}")

    return problems


def main() -> int:
    pages = sorted(
        name for name in os.listdir(ROOT) if name.endswith(".html") and os.path.isfile(os.path.join(ROOT, name))
    )
    failures = 0

    for name in pages:
        problems = check_page(os.path.join(ROOT, name))
        if problems:
            failures += 1
            print(f"FAIL  {name}")
            for problem in problems:
                print(f"      - {problem}")

    expected = {
        "index.html", "about.html", "loans.html", "personal-loan.html", "business-loan.html",
        "home-loan.html", "mortgage-loan.html", "car-loan.html", "education-loan.html",
        "industrial-loan.html", "agriculture-loan.html", "emi-calculator.html", "contact.html", "apply.html",
        "careers.html", "book-a-call.html", "privacy-policy.html", "terms-conditions.html",
        "disclaimer.html", "fees.html", "thank-you.html", "404.html",
    }
    missing = expected - set(pages)
    if missing:
        failures += 1
        print("FAIL  missing pages: " + ", ".join(sorted(missing)))

    print()
    if failures:
        print(f"{failures} page(s) need attention.")
        return 1
    print(f"All {len(pages)} pages passed basic checks.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
