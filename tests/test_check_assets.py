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
        self.assertEqual(self.run_site('<img alt="" src="missing.png"><img alt="" src="missing.png">'),
                         ['Missing local file: missing.png'])

    def test_encoded_paths_and_query_strings(self):
        self.assertEqual(self.run_site('<img alt="" src="assets/my%20photo.png?v=2#preview">',
                                       ['assets/my photo.png']), [])

    def test_external_and_fragment_links_are_skipped(self):
        self.assertEqual(self.run_site('<div id="work"></div><a href="#work"></a><a href="mailto:a@example.com"></a>'
                                       '<img alt="" src="https://example.com/a.png"><img alt="" src="//example.com/a.png">'), [])

    def test_parent_paths_are_rejected(self):
        self.assertIn('escapes portfolio', self.run_site('<img alt="" src="../outside.png">')[0])

    def test_missing_entry_file_is_reported(self):
        with TemporaryDirectory() as folder:
            self.assertIn('Cannot read index.html', checker.check(folder)[0])

    def test_styles_scripts_and_resume_are_checked(self):
        errors = self.run_site('<link href="style.css"><script src="app.js"></script>'
                               '<a href="resume.pdf">Resume</a><video poster="poster.png"></video>')
        self.assertEqual(len(errors), 4)

    def test_invalid_url_does_not_hide_other_failures(self):
        errors = self.run_site('<img alt="" src="https://[broken"><img alt="" src="missing.png">')
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
        self.assertEqual(self.run_site('<a href>Placeholder</a><img alt="" src="missing.png">'),
                         ['Missing local file: missing.png'])

    def test_url_whitespace_is_ignored(self):
        self.assertEqual(self.run_site('<a href="  #work  "></a><div id="work"></div>'
                                       '<img alt="" src="  assets/photo.png  ">', ['assets/photo.png']), [])

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
        self.assertEqual(self.run_site('<img alt="" src="assets/photo.png">', ['assets/Photo.png']),
                         ['Missing local file: assets/photo.png'])

    def test_wrong_directory_case_is_rejected_on_all_platforms(self):
        self.assertEqual(self.run_site('<img alt="" src="assets/photo.png">', ['Assets/photo.png']),
                         ['Missing local file: assets/photo.png'])

    def test_exact_case_and_relative_segments_pass(self):
        self.assertEqual(self.run_site('<img alt="" src="./Assets/../Assets/My%20Photo.png?v=1">',
                                       ['Assets/My Photo.png']), [])


    def test_missing_image_alt_includes_source_line(self):
        self.assertEqual(self.run_site('<p>Photo</p>\n<img src="photo.png">', ['photo.png']),
                         ['Image missing alt attribute at line 2'])

    def test_descriptive_and_decorative_alt_are_allowed(self):
        self.assertEqual(self.run_site('<img src="photo.png" alt="Tampa skyline">'
                                       '<img src="photo.png" alt="">', ['photo.png']), [])

    def test_missing_alt_does_not_hide_missing_asset(self):
        self.assertEqual(self.run_site('<img src="missing.png">'),
                         ['Image missing alt attribute at line 1', 'Missing local file: missing.png'])


    def test_explicit_label_requires_existing_target(self):
        self.assertEqual(self.run_site('<label for="command">Command</label>'),
                         ['Missing label for target: command'])

    def test_forward_label_target_passes(self):
        self.assertEqual(self.run_site('<label for="command-input">Command</label>'
                                       '<input id="command-input">'), [])

    def test_implicit_label_needs_no_for_attribute(self):
        self.assertEqual(self.run_site('<label>Command <input></label>'), [])

    def test_repeated_broken_labels_report_once(self):
        self.assertEqual(self.run_site('<label for="missing">First</label>'
                                       '<label for="missing">Second</label>'),
                         ['Missing label for target: missing'])


if __name__ == '__main__':
    unittest.main()
