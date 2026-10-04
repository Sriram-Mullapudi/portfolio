"""Check static HTML asset references without network access or dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1]


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
        self.anchors = []
        self.ids = set()
        self.duplicate_ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        identifier = attrs.get("id")
        if identifier:
            if identifier in self.ids:
                self.duplicate_ids.add(identifier)
            self.ids.add(identifier)
        href = (attrs.get("href") or "").strip()
        if tag == "a" and href.startswith("#"):
            self.anchors.append(href)
        attribute = "href" if tag in {"a", "link"} else "src"
        if tag in {"a", "link", "img", "script", "source", "video", "audio"}:
            if attrs.get(attribute):
                self.references.append(attrs[attribute].strip())
        if tag == "video" and attrs.get("poster"):
            self.references.append(attrs["poster"].strip())


def check(root):
    root = Path(root).resolve()
    parser = Assets()
    try:
        parser.feed((root / "index.html").read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError) as error:
        return [f"Cannot read index.html: {error}"]
    errors = [f"Duplicate HTML id: {identifier}" for identifier in sorted(parser.duplicate_ids)]
    for reference in dict.fromkeys(parser.anchors):
        target = unquote(reference[1:].split(":~:text=", 1)[0])
        if target and target not in parser.ids:
            errors.append(f"Missing anchor target: {reference}")
    for reference in dict.fromkeys(parser.references):
        try:
            url = urlsplit(reference)
            if url.scheme or url.netloc or not url.path:
                continue
            path = (root / unquote(url.path)).resolve()
            if not path.is_relative_to(root):
                errors.append(f"Reference escapes portfolio: {reference}")
            elif not path.is_file():
                errors.append(f"Missing local file: {reference}")
        except (ValueError, OSError) as error:
            errors.append(f"Invalid reference {reference}: {error}")
    return errors


if __name__ == "__main__":
    errors = check(ROOT)
    if errors:
        print("\n".join(errors), file=sys.stderr)
    else:
        print("OK: static HTML assets, IDs and same-page links checked.")
    raise SystemExit(bool(errors))
