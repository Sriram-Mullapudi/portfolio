# Sriram Mullapudi — Portfolio

Personal software engineering portfolio featuring experience, engineering case studies, interactive system walkthroughs, and photography.

**Live website:** https://sriram-mullapudi.github.io/portfolio/

## Run locally

Open this folder in VS Code and use Live Server on `index.html`, or run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000/ in your browser or VS Code browser preview.
No build or package installation is required. Run the command from the folder
containing `index.html` and keep that terminal open while previewing the site.
Press **Ctrl+C** in the terminal to stop the server.

### Local preview troubleshooting

- **Invalid address:** use `http://127.0.0.1:8000/`. Do not browse to the wildcard
  address `http://[::]:8000/` that an unbound server may print.
- **Port already in use:** stop your previous preview server, or use
  `python -m http.server 8001 --bind 127.0.0.1` and open
  `http://127.0.0.1:8001/`.
- **Directory listing or missing images:** check that the terminal is in this
  repository and that `portfolio-v3-assets/` is beside `index.html`.
- **Old styles after saving:** hard-refresh with **Ctrl+F5**. Local edits do not
  update the public website until you commit and push them.

Binding to `127.0.0.1` makes the preview accessible only on your computer.

## Publish updates

GitHub Pages publishes the root directory of the `main` branch. Commit and push changes to update the live website.

Keep `portfolio-v3-assets/` beside `index.html`. The page uses local fonts, lazy-loaded photography thumbnails, full-size lightbox images, and reduced-motion support.

## Assets

Personal photographs and portfolio content belong to Sriram Mullapudi. Font license notices are included in `portfolio-v3-assets/FONT-LICENSES.txt`.

## Keyboard controls

| Context | Keys | Action |
| --- | --- | --- |
| Page, outside text inputs and dialogs | `T` | Open the portfolio terminal |
| Page, outside text inputs and dialogs | `G` | Return to the top |
| Photo viewer | Left / Right arrow | Previous / next photo |
| Photo viewer | Home / End | First / last photo |
| Any dialog | Escape | Close and return focus to its opener |
| Terminal input | Up / Down arrow | Browse command history; Down restores your unfinished draft |
| Terminal input | Tab | Complete a command or `goto` destination; list multiple matches |

In the terminal, `help` lists commands and `exit` closes the dialog. Consecutive
identical commands occupy one history entry. History is kept only in the current
page session; reloading clears it.

Use Tab and Shift+Tab to reach buttons and links. Architecture stage buttons can
be activated with Enter or Space. The walkthrough can be paused and resumed;
with reduced motion enabled, its main control advances one stage at a time.

## Scroll motion

On screens at least 821px wide and 620px tall, the selected-work showcase pins
below the navigation. Native scroll position controls layered crossfades between the Folio and Speedway
screenshots, including in reverse. Text fades separately to avoid overlapping
headlines, while framed product previews gently recede and advance. Project buttons and keyboard focus bring the
corresponding card into view. The hero portrait also scales subtly with scroll.
Small screens and reduced-motion settings retain ordinary stacked/grid cards;
no wheel or touch scrolling is intercepted. These enhancements are in
`portfolio-v3-assets/scroll-story.css` and `scroll-story.js`.


Section headings, experience entries, project summaries, skill rows, and contact
content slide and fade in from their entry edge when scrolling down or back up.
Entrances replay only after the content leaves the viewport. Keyboard focus
cancels an active entrance, reduced-motion preferences disable it, and content
remains visible if JavaScript is unavailable. Scrolling stays native.

## Validate before publishing

From this folder, run these offline checks with Python 3.9 or newer:

```sh
python -m unittest discover -s tests
python scripts/check_assets.py
node --test tests/check_javascript.test.cjs
node scripts/check_javascript.cjs
```

The checker validates static HTML file references, including images, scripts,
stylesheets, and the resume. File and folder capitalization must match exactly,
even when checking on Windows, so references also work on GitHub Pages. It also catches duplicate HTML IDs and missing
same-page anchor targets. Images must declare an `alt` attribute; use descriptive
text for meaningful images and `alt=""` for decorative ones. The checker cannot
judge whether a description is accurate or useful. Declared `aria-labelledby`, `aria-describedby`, and
`aria-controls` targets must also exist in the static HTML. Explicit form labels
(`label for="input-id"`) must reference an existing ID. Implicit labels wrapping
an input do not need a `for` attribute. This checks target existence, not whether
the target is a labelable form control. These checks do not
replace a browser accessibility review. It reports missing files and paths outside the
portfolio directory. It does not fetch external URLs or inspect CSS URLs,
JavaScript-generated paths, or visual layout. Continue checking the rendered
site on desktop and mobile before publishing design changes.

The same checks run automatically in the **Validate portfolio** GitHub Actions
workflow on both Windows and Linux, on pushes to `main` and on pull requests.
Both platforms run the regression suite and validate the actual site, including
filename capitalization checks that Windows would otherwise overlook. You can also run it manually
from the repository's Actions tab. Review a failed run's logs before publishing
further changes. This workflow reports validation results; it does not block the
separate GitHub Pages deployment or replace desktop and mobile browser checks.

The JavaScript check requires Node.js 18 or newer (available on the GitHub-hosted
CI runners). It parses inline and local classic scripts referenced by index.html
without executing them. Cache query strings are supported. JSON-LD, module
scripts, remote scripts, and dynamically imported files are outside its scope;
it does not replace browser interaction tests.

## Product walkthrough videos

Speedway's project preview is an edited recording of the native app running in
its isolated development profile. It shows three sample items, a real backend
checkout result, and the saved receipt. The sample cash tender does not move
actual funds. Gentle zooms, cursor emphasis, and chapter labels are editorial
overlays; the app's contents and totals are unmodified.

Folio now shows a real upload, local-AI answer, and citation reveal using a
fictional Northstar handbook in a dedicated demo account. The approximately
17-second generation wait is shortened in the 23-second edit and labeled as
such; the generated answer and cited source are unmodified. Both previews
link to an actual app screenshot and offer a larger walkthrough dialog with
native playback controls. Escape closes the dialog and restores button focus.

Previews start muted on first entry into view and pause offscreen or when the tab
is hidden. Reduced motion disables automatic preview playback; explicitly
opening a walkthrough still allows playback. Closing the larger player stops it.

The illustrated-video generator is `scripts/render_product_videos.cjs`.
For recorded footage, `scripts/render_recorded_video.cjs capture.json output.webm`
accepts timestamped local CDP screencast frames, cursor positions, and chapters.
Both require Playwright and Microsoft Edge; `PLAYWRIGHT_MODULE` can point to an
existing installation. Raw recordings stay outside this public repository to
avoid accidentally publishing unrelated application data. Review every finished
video before publishing. No payment processor or paid AI API is used.

### Phone-specific playback

Screens up to 700px wide receive a separate 720×960 detail edit with enlarged
cart/receipt or answer/source crops from the same real recording. Desktop uses
the wide edit. H.264 MP4 is preferred; the existing WebM remains a fallback.
Rotation switches edits, retains the approximate position, and leaves playback
paused so a layout change cannot override a pause choice. The larger player uses
the same screen-specific edit. Posters remain visible before loading.

Regenerate with `node scripts/render_mobile_videos.cjs <private-capture-folder>`
using Playwright/Edge and the same optional PLAYWRIGHT_MODULE setting. The folder
must contain folio-real-capture.json and speedway-real-capture.json. For desktop MP4, run `scripts/render_recorded_video.cjs` with the same capture
JSON and an output path ending in `.mp4`. It encodes H.264 directly from the
saved recording frames without changing app content.
Phone-sized browser tests do not establish physical iPhone/Android compatibility;
real-device playback verification remains a separate manual check.

Run `node scripts/test_product_videos.cjs` with Playwright and Edge to check
real MP4 playback, mobile dimensions, reduced motion, dialog focus restoration,
rotation position, desktop source selection, and overflow at five viewport widths.
This optional browser check uses the same PLAYWRIGHT_MODULE override.
