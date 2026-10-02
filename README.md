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
| Terminal input | Tab | Complete a command or list matching commands |

In the terminal, `help` lists commands and `exit` closes the dialog. Consecutive
identical commands occupy one history entry. History is kept only in the current
page session; reloading clears it.

Use Tab and Shift+Tab to reach buttons and links. Architecture stage buttons can
be activated with Enter or Space. The walkthrough can be paused and resumed;
with reduced motion enabled, its main control advances one stage at a time.

## Validate before publishing

From this folder, run these offline checks with Python 3.9 or newer:

```sh
python -m unittest discover -s tests
python scripts/check_assets.py
```

The checker validates static HTML file references, including images, scripts,
stylesheets, and the resume. It reports missing files and paths outside the
portfolio directory. It does not fetch external URLs or inspect CSS URLs,
JavaScript-generated paths, or visual layout. Continue checking the rendered
site on desktop and mobile before publishing design changes.
