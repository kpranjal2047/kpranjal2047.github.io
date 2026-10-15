'use strict';

// The archive is rendered into HTML so every project is accessible without JS.
const archive = document.querySelector('#repository-list');
const rows = Array.from(archive.querySelectorAll('.repo-row'));
const search = document.querySelector('#project-search');
const sort = document.querySelector('#project-sort');
const filters = Array.from(document.querySelectorAll('[data-filter]'));
let selectedCategory = 'all';

function updateArchive() {
  const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let visible = 0;
  rows.forEach((row) => {
    const categoryMatch = selectedCategory === 'all' || row.dataset.category === selectedCategory;
    const searchMatch = terms.every((term) => row.dataset.search.includes(term));
    row.hidden = !(categoryMatch && searchMatch);
    if (!row.hidden) visible += 1;
  });
  document.querySelector('#result-count').textContent = `Showing ${visible} of ${rows.length} repositories`;
  document.querySelector('#empty-state').hidden = visible !== 0;
  filters.forEach((button) => {
    const active = button.dataset.filter === selectedCategory;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

filters.forEach((button) => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    updateArchive();
  });
});
search.addEventListener('input', updateArchive);
sort.addEventListener('change', () => {
  const sorted = [...rows].sort((a, b) => sort.value === 'name'
    ? a.dataset.name.localeCompare(b.dataset.name)
    : b.dataset.updated.localeCompare(a.dataset.updated) || rows.indexOf(a) - rows.indexOf(b));
  sorted.forEach((row) => archive.append(row));
});
document.querySelector('#reset-filters').addEventListener('click', () => {
  search.value = '';
  selectedCategory = 'all';
  updateArchive();
  search.focus();
});

// Fixed sample data illustrates the app's documented notification use cases.
const demoStates = {
  progress: { pill: '↓ 68%', icon: '↓', source: 'Download manager', title: 'Almost there.', description: 'Your download is making progress.', detail: '680 MB of 1 GB', value: '68%', progress: '68%' },
  media: { pill: '♫ 2:34', icon: '♫', source: 'Media playback', title: 'A little focus music.', description: 'Playback time, always a glance away.', detail: '02:34 elapsed', value: '04:12', progress: '61%' },
  travel: { pill: '↗ Ride', icon: '↗', source: 'Trip progress', title: 'On your way.', description: 'Follow a supported ride as it updates.', detail: 'Trip in progress', value: 'Live', progress: '42%' },
};
const demoButtons = Array.from(document.querySelectorAll('[data-demo]'));
demoButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const state = demoStates[button.dataset.demo];
    for (const key of ['pill', 'icon', 'source', 'title', 'description', 'detail', 'value']) {
      document.querySelector(`#demo-${key}`).textContent = state[key];
    }
    document.querySelector('#demo-progress').style.width = state.progress;
    demoButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
  });
});

const copyButton = document.querySelector('#copy-email');
const copyStatus = document.querySelector('#copy-status');
let copyReset;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('kpranjal2047@gmail.com');
    copyButton.textContent = 'Copied ✓';
    copyStatus.textContent = 'Email address copied to clipboard.';
    clearTimeout(copyReset);
    copyReset = setTimeout(() => { copyButton.innerHTML = 'Copy email <span aria-hidden="true">⧉</span>'; }, 2500);
  } catch {
    copyButton.textContent = 'Select the email to copy';
    copyStatus.textContent = 'Clipboard access is unavailable. Select the email address or use the email link.';
  }
});
document.querySelector('#year').textContent = new Date().getFullYear();
