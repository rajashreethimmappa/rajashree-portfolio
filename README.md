# Rajashree Thimmappa — Portfolio

Personal portfolio for IT project, delivery and release management roles. Hand-built in plain HTML, CSS and JavaScript, with no frameworks, no build step and no tracking.

**Live site:** _add your GitHub Pages or Netlify link here_

## What's inside

```
index.html        Single-page site: hero, release history, case studies, approach, experience, skills, contact
css/styles.css    Design tokens, layout, responsive rules (desktop, tablet, mobile)
js/main.js        Mobile menu, case-study filters, active-section highlighting
js/charts.js      Hand-built SVG charts: impact comparison, selectable career timeline, burndown, KPI minis
assets/fonts/     Self-hosted fonts (Bricolage Grotesque, IBM Plex Sans; SIL Open Font License)
assets/img/       Profile photo and favicon
```

## Front-end details

- Semantic HTML with landmarks, skip link and visible keyboard focus
- Responsive layout with CSS Grid; the release timeline switches to a vertical track on mobile
- Interactive SVG charts written from scratch (no chart library): hover and keyboard tooltips, crosshair on the burndown, animate-on-scroll, redraw on resize, a table view for every chart
- Chart colours checked for colour-blind separation and contrast
- Accessible tabs (WAI-ARIA pattern with arrow-key navigation) for the delivery toolkit
- Risk register with a probability × impact matrix generated from the table data
- Accessible filter buttons (`aria-pressed`) for case studies
- `IntersectionObserver` highlights the current section in the navigation
- Respects `prefers-reduced-motion`
- Works fully without JavaScript
- Fonts are self-hosted, so the site makes no third-party requests

## Run locally

Open `index.html` in a browser, or serve the folder so the fonts load:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

Static site: works on GitHub Pages or Netlify with no configuration.
