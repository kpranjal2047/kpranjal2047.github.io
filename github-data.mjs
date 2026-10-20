// Pure data helpers and an unauthenticated, paginated public-GitHub request.
export const USERNAME = 'kpranjal2047';
export const CACHE_KEY = `portfolio-github:${USERNAME}:v1`;
export const API_ROOT = `https://api.github.com/users/${USERNAME}/repos`;

export function normalizeRepository(repo) {
  if (!repo || typeof repo.name !== 'string' || !/^[\w.-]{1,100}$/.test(repo.name)
      || typeof repo.owner?.login !== 'string' || repo.owner.login.toLowerCase() !== USERNAME || repo.private === true
      || typeof repo.updated_at !== 'string' || !Number.isFinite(Date.parse(repo.updated_at))) return null;
  return {
    name: repo.name,
    owner: { login: USERNAME },
    updated_at: repo.updated_at,
    description: typeof repo.description === 'string' ? repo.description.slice(0, 2000) : '',
    language: typeof repo.language === 'string' ? repo.language.slice(0, 100) : '',
    topics: Array.isArray(repo.topics) ? repo.topics.filter(t => typeof t === 'string').slice(0, 30).map(t => t.slice(0, 100)) : [],
    fork: repo.fork === true,
    archived: repo.archived === true,
    stargazers_count: Number.isSafeInteger(repo.stargazers_count) && repo.stargazers_count >= 0 ? repo.stargazers_count : 0,
    forks_count: Number.isSafeInteger(repo.forks_count) && repo.forks_count >= 0 ? repo.forks_count : 0,
  };
}

export function classifyRepository(repo) {
  const topics = repo.topics.join(' ').toLowerCase();
  if (/android|kotlin/.test(topics) || repo.language === 'Kotlin') return 'Android';
  if (/machine-learning|deep-learning|reinforcement-learning|data-science|recommend/.test(topics)
      || repo.language === 'Jupyter Notebook') return 'Machine learning';
  if (/database|hashing|normalization/.test(topics)) return 'Databases';
  if (['JavaScript', 'TypeScript', 'HTML', 'CSS'].includes(repo.language)) return 'Web';
  if (['Java', 'Swift', 'Dart', 'C#'].includes(repo.language)) return 'Applications';
  return 'Tools';
}

export function mergeRepositories(repositories, curated = []) {
  const notes = new Map(curated.map(project => [project.slug.toLowerCase(), project]));
  return repositories.map(normalizeRepository).filter(Boolean).map(repo => {
    const project = notes.get(repo.name.toLowerCase());
    const language = repo.language || 'Not specified';
    const kind = repo.fork ? 'Fork' : project?.kind === 'Fork' ? 'Personal project' : project?.kind || 'Personal project';
    return {
      slug: repo.name,
      title: project?.title || repo.name.replace(/[-_]/g, ' '),
      category: project?.category || classifyRepository(repo),
      language,
      updated: repo.updated_at,
      kind: `${kind}${repo.archived ? ' · Archived' : ''}`,
      summary: repo.description || project?.summary || 'Explore the source and documentation on GitHub.',
      details: project?.details || repo.description || 'This repository has no public description. Open GitHub to explore its files and documentation.',
      technologies: [...new Set([...(project?.technologies || []), ...(repo.language ? [repo.language] : []), ...repo.topics])],
      url: `https://github.com/${USERNAME}/${encodeURIComponent(repo.name)}`,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
    };
  }).sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated) || a.title.localeCompare(b.title));
}

export async function fetchRepositories(fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const repositories = [];
  try {
    // Follow all pages within this one page-load operation. Never show a partial list.
    for (let page = 1; page <= 100; page += 1) {
      const response = await fetcher(`${API_ROOT}?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`, {
        signal: controller.signal,
        credentials: 'omit',
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) {
        const error = new Error(response.status === 403 || response.status === 429 ? 'GitHub rate limit or access restriction' : 'GitHub unavailable');
        error.status = response.status;
        throw error;
      }
      const batch = await response.json();
      if (!Array.isArray(batch) || batch.some(repo => !normalizeRepository(repo))) throw new Error('Unexpected repository response');
      repositories.push(...batch.map(normalizeRepository));
      const links = response.headers.get('link');
      if (links ? !/rel="next"/.test(links) : batch.length < 100) {
        return [...new Map(repositories.map(repo => [repo.name.toLowerCase(), repo])).values()];
      }
    }
    throw new Error('Repository pagination did not complete');
  } finally {
    clearTimeout(timeout);
  }
}

export function readCache(storage, now = Date.now()) {
  try {
    const cached = JSON.parse(storage.getItem(CACHE_KEY));
    if (cached?.version !== 1 || !Number.isFinite(cached.fetchedAt)
        || cached.fetchedAt > now + 60000 || !Array.isArray(cached.repositories)
        || cached.repositories.some(repo => !normalizeRepository(repo))) return null;
    return { fetchedAt: cached.fetchedAt, repositories: cached.repositories.map(normalizeRepository) };
  } catch { return null; }
}

export function writeCache(storage, repositories, fetchedAt) {
  try {
    storage.setItem(CACHE_KEY, JSON.stringify({ version: 1, fetchedAt, repositories }));
  } catch { /* Live loading also works when storage is blocked or full. */ }
}
