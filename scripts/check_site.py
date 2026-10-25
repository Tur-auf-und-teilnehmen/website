#!/usr/bin/env python3
"""Dependency-free checks for the static GitHub Pages website."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
REQUIRED_PAGES = ("index.html", "pulseline-qr.html")
RESOURCE_ATTRIBUTES = {
    "a": ("href",),
    "link": ("href",),
    "img": ("src",),
    "script": ("src",),
    "source": ("src",),
    "audio": ("src",),
    "video": ("src", "poster"),
    "iframe": ("src",),
}


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.duplicate_ids = set()
        self.references = []
        self.titles = 0
        self.has_h1 = False

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        element_id = attributes.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicate_ids.add(element_id)
            self.ids.add(element_id)

        if tag == "title":
            self.titles += 1
        if tag == "h1":
            self.has_h1 = True

        for attribute in RESOURCE_ATTRIBUTES.get(tag, ()):
            value = attributes.get(attribute)
            if value:
                self.references.append((tag, attribute, value.strip()))


def main():
    errors = []
    pages = {}
    html_files = sorted(ROOT.glob("*.html"))

    for required_page in REQUIRED_PAGES:
        if not (ROOT / required_page).is_file():
            errors.append(f"Missing required page: {required_page}")

    for file in html_files:
        html = file.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(html)
        parser.close()
        pages[file.resolve()] = parser

        if not re.match(r"\s*<!doctype\s+html\b", html, re.IGNORECASE):
            errors.append(f"{file.name}: missing HTML5 doctype")
        if parser.titles != 1:
            errors.append(f"{file.name}: expected exactly one <title>, found {parser.titles}")
        for element_id in sorted(parser.duplicate_ids):
            errors.append(f"{file.name}: duplicate id #{element_id}")

    index = pages.get((ROOT / "index.html").resolve())
    if index and not index.has_h1:
        errors.append("index.html: missing <h1>")

    checked = 0
    for page, parsed in pages.items():
        for tag, attribute, value in parsed.references:
            url = urlsplit(value)
            if url.scheme or url.netloc:
                continue  # External links are not checked for availability.
            pathname = unquote(url.path)
            if pathname.startswith("/"):
                errors.append(f"{page.name}: root-absolute URL '{value}' breaks project Pages paths")
                continue

            target = (page.parent / pathname).resolve() if pathname else page
            if target.is_dir():
                target = target / "index.html"
            try:
                target.relative_to(ROOT)
            except ValueError:
                errors.append(f"{page.name}: URL escapes repository: '{value}'")
                continue

            checked += 1
            if not target.is_file():
                errors.append(f"{page.name}: missing local target '{value}' ({tag}[{attribute}])")
                continue
            if url.fragment and target.suffix.lower() == ".html":
                linked_page = pages.get(target)
                if linked_page is None:
                    errors.append(f"{page.name}: linked HTML page not checked: '{value}'")
                elif unquote(url.fragment) not in linked_page.ids:
                    errors.append(f"{page.name}: missing anchor in '{value}'")

    print(f"Checked {len(pages)} HTML pages and {checked} local links/assets.")
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("PASS: HTML entrypoints, IDs, anchors, and local resources.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
