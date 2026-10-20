# Kumar Pranjal — Engineering Studio

A dependency-free, responsive portfolio for Kumar Pranjal, Senior Application Software Engineer at Oracle. The selected Engineering Studio design includes Overview, Experience, Projects, and About & contact, with a dark default theme and a persistent light/dark switch.

## Preview

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open http://127.0.0.1:5173. Refresh after edits. Publish the repository root through GitHub Pages; no package installation is required.

## Edit

- `index.html`: page content, professional experience, education, contact details, and project highlights.
- `styles.css`: theme tokens, responsive layouts, and the conceptual phone preview.
- `app.js`: hash navigation, theme persistence, archive search/filter/sort, sample notification states, and copy-email behavior.
- `data/projects.json`: reviewed repository summaries and source URLs.
- `scripts/build.py`: regenerates the static archive between the repository markers in `index.html`. Run `python3 scripts/build.py` after changing repository data. If adding or removing repositories, update category counts and the snapshot date in the surrounding page.
- `assets/kumar-pranjal-resume.pdf`: the owner-provided résumé, used by the view/download links. Replace this file when updating the résumé, and reconcile the page content.

## Navigation and accessibility

The sections use native anchor links with shareable URLs (`#overview`, `#experience`, `#projects`, `#about`, and `#archive`). Browser Back/Forward restores the selected section. Without JavaScript, all sections and repository details remain available. Native disclosure elements expose the full repository archive and individual project details. Search, filters, sorting, the notification concept, and copy-email require JavaScript.

The site includes a skip link, visible keyboard focus, active navigation labels, live announcements for filtering and clipboard results, reduced-motion support, and layouts for mobile and desktop. Theme preference is stored locally when browser storage is available. The default matches the approved dark Engineering Studio design.

## Content sources

Professional experience, achievements, internships, technical skills, education, and contact details come from the owner-provided résumé, reviewed on 20 October 2026. The source PDF is included as an intentional public résumé asset. Approximate metrics retain their original qualifications; team results are described as contributions.

All 19 publicly listed GitHub repositories were reviewed on 15 October 2026. Their landing pages and available READMEs informed the summaries; selected source/documentation was reviewed for Live Progress and AER Ad Bot. This is a dated snapshot, not a live GitHub connection. Private repositories are outside its scope. Collaborative coursework and the Coursera upstream fork are labeled. Sparsely documented repositories have limited descriptions. Dates describe repository updates, not completion dates.

The phone and notification preview are original HTML/CSS concepts using fixed sample data, not screenshots or a live connection to the Android application. No analytics, external fonts, GitHub API requests, or runtime dependencies are needed to render the portfolio.
