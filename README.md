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

On screens at least 1000px wide and 700px tall, the selected-work showcase pins
below the navigation. Native scroll position scrubs between the Folio and Speedway
screenshots, including in reverse. Project buttons and keyboard focus bring the
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
