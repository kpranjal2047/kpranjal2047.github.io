'use strict';

// Native links and visible sections work without JavaScript. Enhance them into
// the selected Engineering Studio navigation, with shareable hash URLs.
const sections = Array.from(document.querySelectorAll('.page-panel'));
const navigation = Array.from(document.querySelectorAll('.section-nav a'));
const pageTitles = { overview: 'Software Engineer', experience: 'Experience', projects: 'Projects', about: 'About & Contact' };
function showSection() {
  const requested = window.location.hash.slice(1);
  const active = requested === 'main' ? (sections.find(section => !section.hidden)?.id || 'overview') : requested === 'archive' ? 'projects' : sections.some(section => section.id === requested) ? requested : 'overview';
  // Preserve the skip link's native focus/scroll behavior.
  sections.forEach(section => { section.hidden = section.id !== active; });
  navigation.forEach(link => {
    if (link.hash === `#${active}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (requested === 'archive') document.querySelector('#archive').open = true;
  document.title = `Kumar Pranjal — ${pageTitles[active]}`;
  if (requested === 'archive') document.querySelector('#archive').scrollIntoView();
  else if (requested !== 'main') window.scrollTo(0, 0);
}
document.documentElement.classList.add('js-ready');
showSection();
window.addEventListener('hashchange', showSection);
document.querySelectorAll('a[href^="#"]').forEach(link => {
  if (!sections.some(section => link.hash === `#${section.id}`)) return;
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
    showSection();
  });
});

const themeButton = document.querySelector('#theme-toggle');
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton.firstElementChild.textContent = dark ? '☼' : '☾';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#0b141c' : '#f3f6f5';
}
applyTheme(document.documentElement.dataset.theme);
themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(theme);
  try { localStorage.setItem('portfolio-theme', theme); } catch { /* Optional persistence. */ }
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
