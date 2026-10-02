"""Regression tests use temporary sites, never the real portfolio files."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

spec = importlib.util.spec_from_file_location("checker", Path(__file__).resolve().parents[1] / "scripts/check_assets.py")
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class AssetChecks(unittest.TestCase):
    def run_site(self, html, files=()):
        with TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "index.html").write_text(html, encoding="utf-8")
            for name in files:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"fixture")
            return checker.check(root)

    def test_missing_files_are_deduplicated(self):
        self.assertEqual(self.run_site('<img src="missing.png"><img src="missing.png">'),
                         ['Missing local file: missing.png'])

    def test_encoded_paths_and_query_strings(self):
        self.assertEqual(self.run_site('<img src="assets/my%20photo.png?v=2#preview">',
                                       ['assets/my photo.png']), [])

    def test_external_and_fragment_links_are_skipped(self):
        self.assertEqual(self.run_site('<a href="#work"></a><a href="mailto:a@example.com"></a>'
                                       '<img src="https://example.com/a.png"><img src="//example.com/a.png">'), [])

    def test_parent_paths_are_rejected(self):
        self.assertIn('escapes portfolio', self.run_site('<img src="../outside.png">')[0])

    def test_missing_entry_file_is_reported(self):
        with TemporaryDirectory() as folder:
            self.assertIn('Cannot read index.html', checker.check(folder)[0])

    def test_styles_scripts_and_resume_are_checked(self):
        errors = self.run_site('<link href="style.css"><script src="app.js"></script>'
                               '<a href="resume.pdf">Resume</a><video poster="poster.png"></video>')
        self.assertEqual(len(errors), 4)

    def test_invalid_url_does_not_hide_other_failures(self):
        errors = self.run_site('<img src="https://[broken"><img src="missing.png">')
        self.assertEqual(len(errors), 2)
        self.assertIn('Invalid reference', errors[0])


if __name__ == '__main__':
    unittest.main()
