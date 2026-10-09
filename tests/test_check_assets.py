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
        self.assertEqual(self.run_site('<div id="work"></div><a href="#work"></a><a href="mailto:a@example.com"></a>'
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


    def test_duplicate_ids_are_reported_once(self):
        self.assertEqual(self.run_site('<div id="work"></div><span id="work"></span><p id="work"></p>'),
                         ['Duplicate HTML id: work'])

    def test_unique_ids_pass(self):
        self.assertEqual(self.run_site('<div id="work"></div><div id="projects"></div>'), [])


    def test_missing_anchor_is_reported_once(self):
        self.assertEqual(self.run_site('<a href="#missing"></a><a href="#missing"></a>'),
                         ['Missing anchor target: #missing'])

    def test_forward_encoded_anchor_passes(self):
        self.assertEqual(self.run_site('<a href="#w%6Frk"></a><section id="work"></section>'), [])

    def test_empty_and_text_fragments_pass(self):
        self.assertEqual(self.run_site('<a href="#"></a><a href="#:~:text=hello"></a>'), [])

    def test_anchor_with_text_fragment_passes(self):
        self.assertEqual(self.run_site('<a href="#work:~:text=hello"></a><section id="work"></section>'), [])


    def test_valueless_href_does_not_crash_or_hide_missing_files(self):
        self.assertEqual(self.run_site('<a href>Placeholder</a><img src="missing.png">'),
                         ['Missing local file: missing.png'])

    def test_url_whitespace_is_ignored(self):
        self.assertEqual(self.run_site('<a href="  #work  "></a><div id="work"></div>'
                                       '<img src="  assets/photo.png  ">', ['assets/photo.png']), [])

    def test_whitespace_around_broken_anchor_is_checked(self):
        self.assertEqual(self.run_site('<a href="  #missing  "></a>'),
                         ['Missing anchor target: #missing'])


    def test_missing_accessibility_targets_are_reported(self):
        for attribute in ('aria-labelledby', 'aria-describedby', 'aria-controls'):
            with self.subTest(attribute=attribute):
                self.assertEqual(self.run_site(f'<button {attribute}="missing"></button>'),
                                 [f'Missing {attribute} target: missing'])

    def test_multiple_forward_accessibility_targets_pass(self):
        self.assertEqual(self.run_site('<section aria-labelledby="title subtitle" aria-describedby="description">'
                                       '<h2 id="title">Title</h2><span id="subtitle">Subtitle</span>'
                                       '<p id="description">Description</p></section>'), [])

    def test_repeated_missing_accessibility_target_reported_once(self):
        self.assertEqual(self.run_site('<button aria-controls="missing missing"></button>'
                                       '<button aria-controls="missing"></button>'),
                         ['Missing aria-controls target: missing'])

    def test_empty_accessibility_attributes_are_safe(self):
        self.assertEqual(self.run_site('<div aria-labelledby aria-describedby="  " aria-controls=""></div>'), [])


    def test_wrong_filename_case_is_rejected_on_all_platforms(self):
        self.assertEqual(self.run_site('<img src="assets/photo.png">', ['assets/Photo.png']),
                         ['Missing local file: assets/photo.png'])

    def test_wrong_directory_case_is_rejected_on_all_platforms(self):
        self.assertEqual(self.run_site('<img src="assets/photo.png">', ['Assets/photo.png']),
                         ['Missing local file: assets/photo.png'])

    def test_exact_case_and_relative_segments_pass(self):
        self.assertEqual(self.run_site('<img src="./Assets/../Assets/My%20Photo.png?v=1">',
                                       ['Assets/My Photo.png']), [])


if __name__ == '__main__':
    unittest.main()
