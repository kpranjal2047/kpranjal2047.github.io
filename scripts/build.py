"""Render the static archive from data/projects.json. No dependencies required."""
import json
from datetime import date
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/projects.json').read_text())
projects = data['projects']
assert len({p['slug'] for p in projects}) == len(projects), 'Duplicate repository slug'
rows = []
for i, p in enumerate(projects, 1):
    e = lambda key: escape(str(p[key]), quote=True)
    keywords = escape(' '.join([p['title'], p['slug'], p['summary'], p['category'], p['language'], p['kind'], *p['technologies']]).lower(), quote=True)
    tags = ''.join(f'<span>{escape(t)}</span>' for t in p['technologies'])
    short_date = date.fromisoformat(p['updated']).strftime('%b %Y')
    rows.append(f'''  <details class="repo-row" data-category="{e('category')}" data-name="{e('title')}" data-updated="{e('updated')}" data-search="{keywords}">
    <summary><span class="repo-main"><span class="repo-number">{i:02}</span><span><span class="repo-name">{e('title')}</span><span class="repo-summary">{e('summary')}</span><span class="repo-kind">{e('kind')}</span></span></span><span class="repo-language"><i class="language-dot {e('language').split()[0].lower()}"></i>{e('language')}</span><time datetime="{e('updated')}">{short_date}</time><span class="expand-icon" aria-hidden="true">+</span></summary>
    <div class="repo-details"><p>{e('details')}</p><div class="repo-detail-footer"><div class="tag-list">{tags}</div><a href="{e('url')}" target="_blank" rel="noopener noreferrer">View {e('slug')} on GitHub <span aria-hidden="true">↗</span></a></div></div>
  </details>''')
page = ROOT / 'index.html'
text = page.read_text()
start, end = '<!-- REPOSITORIES:START -->', '<!-- REPOSITORIES:END -->'
before, remainder = text.split(start)
_, after = remainder.split(end)
page.write_text(before + start + '\n' + '\n'.join(rows) + '\n' + end + after)
print(f'Rendered {len(projects)} repositories into index.html')
