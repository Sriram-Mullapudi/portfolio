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

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        attribute = "href" if tag in {"a", "link"} else "src"
        if tag in {"a", "link", "img", "script", "source", "video", "audio"}:
            if attrs.get(attribute):
                self.references.append(attrs[attribute])
        if tag == "video" and attrs.get("poster"):
            self.references.append(attrs["poster"])


def check(root):
    root = Path(root).resolve()
    parser = Assets()
    try:
        parser.feed((root / "index.html").read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError) as error:
        return [f"Cannot read index.html: {error}"]
    errors = []
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
        print("OK: static HTML file references exist.")
    raise SystemExit(bool(errors))
