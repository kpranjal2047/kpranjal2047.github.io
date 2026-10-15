# Kumar Pranjal — Portfolio

A fresh, dependency-free static portfolio for Kumar Pranjal, Senior Software Engineer at Oracle.

## Local preview

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Open http://127.0.0.1:5173. Refresh after edits. Publish the repository root through GitHub Pages; no package installation or build service is needed.

## Files

- `index.html` — complete page and pre-rendered repository archive.
- `styles.css` — responsive layouts and project concept illustrations.
- `app.js` — archive search, filters, sorting, notification concept demo, and copy-email interaction.
- `data/projects.json` — reviewed repository summaries and source URLs.
- `scripts/build.py` — updates the archive HTML from the JSON file. Run `python3 scripts/build.py` after changing repository data. Update category counts and snapshot date in the surrounding page if the repository list changes.

## Content provenance

All 19 repositories publicly listed at https://github.com/kpranjal2047?tab=repositories were reviewed on 15 October 2026. Repository landing pages and available READMEs informed the summaries. Selected supporting documents/source were inspected for Live Progress and AER Ad Bot.

The owner's role (Senior Software Engineer at Oracle) and contact email were supplied directly. No claims about Oracle responsibilities, experience duration, availability for employment, or education are made. Private repositories are outside this snapshot.

Collaborative coursework and the Coursera upstream fork are explicitly identified. Repositories without documentation have deliberately limited descriptions. Dates describe repository updates, not employment history or project completion dates. The website repository's displayed language and update date reflect the public GitHub snapshot before this local rebuild.

The notification preview and project artwork are original HTML/CSS concepts with illustrative data, not screenshots or live connections to the underlying applications. No GitHub API requests, analytics, external fonts, third-party assets, or runtime dependencies are needed to render the site. Refresh the snapshot manually to keep it current.

The previous compiled application, original images, résumé and social links were removed as part of the rebuild.
