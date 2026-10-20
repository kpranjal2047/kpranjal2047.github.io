import { fetchRepositories, mergeRepositories, readCache, writeCache } from './github-data.mjs';

const list = document.querySelector('#repository-list');
const search = document.querySelector('#project-search');
const sort = document.querySelector('#project-sort');
const filters = Array.from(document.querySelectorAll('[data-filter]'));
const status = document.querySelector('#github-status');
const curated = JSON.parse(document.querySelector('#repository-curation').textContent).projects;
let rows = Array.from(list.querySelectorAll('.repo-row'));
let selectedCategory = 'all';

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function updateArchive() {
  const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let visible = 0;
  rows.forEach(row => {
    row.hidden = !((selectedCategory === 'all' || row.dataset.category === selectedCategory)
      && terms.every(term => row.dataset.search.includes(term)));
    if (!row.hidden) visible += 1;
  });
  document.querySelector('#result-count').textContent = `Showing ${visible} of ${rows.length} repositories`;
  document.querySelector('#empty-state').hidden = visible !== 0;
  filters.forEach(button => {
    const count = rows.filter(row => button.dataset.filter === 'all' || row.dataset.category === button.dataset.filter).length;
    button.querySelector('span').textContent = count;
    const active = button.dataset.filter === selectedCategory;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-repo-count]').forEach(node => { node.textContent = rows.length; });
}

function sortArchive() {
  const sorted = [...rows].sort((a, b) => sort.value === 'name'
    ? a.dataset.name.localeCompare(b.dataset.name)
    : Date.parse(b.dataset.updated) - Date.parse(a.dataset.updated) || a.dataset.name.localeCompare(b.dataset.name));
  sorted.forEach(row => list.append(row));
}

function createRow(project, index) {
  const row = element('details', 'repo-row');
  row.dataset.slug = project.slug;
  row.dataset.category = project.category;
  row.dataset.name = project.title;
  row.dataset.updated = project.updated;
  row.dataset.search = [project.title, project.slug, project.summary, project.category, project.language, project.kind, ...project.technologies].join(' ').toLowerCase();
  const summary = element('summary');
  const main = element('span', 'repo-main');
  const content = element('span');
  content.append(element('span', 'repo-name', project.title), element('span', 'repo-summary', project.summary), element('span', 'repo-kind', project.kind));
  main.append(element('span', 'repo-number', String(index + 1).padStart(2, '0')), content);
  const language = element('span', 'repo-language');
  language.append(element('i', 'language-dot'), document.createTextNode(project.language));
  const date = element('time', '', new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(project.updated)));
  date.dateTime = project.updated;
  const expand = element('span', 'expand-icon', '+');
  expand.setAttribute('aria-hidden', 'true');
  summary.append(main, language, date, expand);
  const details = element('div', 'repo-details');
  const stats = element('p', 'repository-stats', `${project.stars} ${project.stars === 1 ? 'star' : 'stars'} · ${project.forks} ${project.forks === 1 ? 'fork' : 'forks'}`);
  const footer = element('div', 'repo-detail-footer');
  const tags = element('div', 'tag-list');
  project.technologies.forEach(technology => tags.append(element('span', '', technology)));
  const link = element('a', '', `View ${project.slug} on GitHub ↗`);
  link.href = project.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  footer.append(tags, link);
  details.append(element('p', '', project.details), stats, footer);
  row.append(summary, details);
  return row;
}

function renderRepositories(repositories) {
  const projects = mergeRepositories(repositories, curated);
  const open = new Set(rows.filter(row => row.open).map(row => row.dataset.slug));
  const newRows = projects.map((project, index) => {
    const row = createRow(project, index);
    row.open = open.has(project.slug);
    return row;
  });
  const fragment = document.createDocumentFragment();
  newRows.forEach(row => fragment.append(row));
  list.replaceChildren(fragment);
  rows = newRows;
  sortArchive();
  updateArchive();
  // Keep editorial project descriptions; update their live metadata and visibility.
  document.querySelectorAll('.featured-project, .project-card').forEach(card => {
    const link = card.querySelector('a[href^="https://github.com/kpranjal2047/"]');
    const slug = link && new URL(link.href).pathname.split('/')[2];
    const project = projects.find(item => item.slug.toLowerCase() === slug?.toLowerCase());
    card.hidden = !project;
    if (!project) return;
    let metadata = card.querySelector('.project-live-meta');
    if (!metadata) {
      metadata = element('p', 'project-live-meta');
      (card.querySelector('.feature-copy') || card).append(metadata);
    }
    const date = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(project.updated));
    metadata.textContent = `${project.language} · ${project.stars} ${project.stars === 1 ? 'star' : 'stars'} · ${project.forks} ${project.forks === 1 ? 'fork' : 'forks'} · Updated ${date}`;
  });
}

function setStatus(message, state) {
  status.textContent = message;
  status.dataset.state = state;
}
function timestamp(time) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(time));
}

filters.forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.filter;
  updateArchive();
}));
search.addEventListener('input', updateArchive);
sort.addEventListener('change', sortArchive);
document.querySelector('#reset-filters').addEventListener('click', () => {
  search.value = '';
  selectedCategory = 'all';
  updateArchive();
  search.focus();
});
updateArchive();

// Exactly one load operation per document. No polling, focus listeners, or retries.
async function loadRepositories() {
  let storage;
  try { storage = window.localStorage; } catch { /* Storage is optional. */ }
  const cached = storage ? readCache(storage) : null;
  if (cached) renderRepositories(cached.repositories);
  setStatus(cached ? `Checking GitHub · saved data from ${timestamp(cached.fetchedAt)}` : 'Loading public repositories from GitHub…', 'loading');
  try {
    const repositories = await fetchRepositories();
    renderRepositories(repositories);
    const fetchedAt = Date.now();
    if (storage) writeCache(storage, repositories, fetchedAt);
    setStatus(`Loaded from GitHub · ${timestamp(fetchedAt)}`, 'live');
  } catch (error) {
    const reason = error.status === 403 || error.status === 429 ? 'GitHub rate limit or access restriction.' : 'GitHub could not be reached.';
    const fallback = cached ? `Showing saved data from ${timestamp(cached.fetchedAt)}.` : 'Showing the built-in snapshot from 15 October 2026.';
    setStatus(`${reason} ${fallback} Reload the page to try again.`, 'fallback');
  }
}
loadRepositories();
