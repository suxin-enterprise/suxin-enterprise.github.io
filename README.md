# SuXin website

Marketing site for SuXin (POS · Barcode Scan · WMS · Every Data · Books). Plain static HTML/CSS/JS, no build step.

- `index.html`: the whole page
- `assets/site.css`: shared layout system (dark default, light theme via the sun/moon button)
- `assets/suxin.css`: SuXin-specific tweaks
- `assets/site.js`: menu, tabs, theme, scroll animations. Put the real sign-up and Android app URLs in `LINKS` at the top.

After editing `index.html` or anything in `assets/`, run `python3 scripts/build_products.py`: it rebuilds the product pages and updates the `?v=` version tags so browsers fetch the new CSS/JS.

Hosted on GitHub Pages from the `main` branch.
