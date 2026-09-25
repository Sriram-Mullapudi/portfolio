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
