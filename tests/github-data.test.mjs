import test from 'node:test';
import assert from 'node:assert/strict';
import { USERNAME, CACHE_KEY, normalizeRepository, mergeRepositories, fetchRepositories, readCache, writeCache } from '../github-data.mjs';

const repo = (name = 'example', extra = {}) => ({ name, owner: { login: USERNAME }, updated_at: '2026-10-20T12:00:00Z', description: 'A new project', language: 'JavaScript', topics: [], fork: false, stargazers_count: 3, forks_count: 1, ...extra });
const response = (body, link = null) => ({ ok: true, headers: { get: () => link }, json: async () => body });
const storage = () => { const entries = new Map(); return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) }; };

test('new public repositories appear, removed repositories do not survive from curation', () => {
  const projects = mergeRepositories([repo('brand-new')], [{ slug: 'deleted', title: 'Removed' }]);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].slug, 'brand-new');
  assert.equal(projects[0].category, 'Web');
  assert.equal(projects[0].url, 'https://github.com/kpranjal2047/brand-new');
});

test('live metadata replaces stale values while curated project context survives', () => {
  const [project] = mergeRepositories([repo('existing', { language: 'Kotlin', archived: true, fork: true })], [{ slug: 'existing', title: 'Friendly title', category: 'Android', details: 'Reviewed notes', technologies: ['Android 16+'], kind: 'Collaborative coursework', summary: 'Old description', updated: '2020-01-01' }]);
  assert.equal(project.title, 'Friendly title');
  assert.equal(project.summary, 'A new project');
  assert.equal(project.details, 'Reviewed notes');
  assert.equal(project.language, 'Kotlin');
  assert.equal(project.updated, '2026-10-20T12:00:00Z');
  assert.equal(project.kind, 'Fork · Archived');
  assert.equal(project.stars, 3);
  assert.deepEqual(project.technologies, ['Android 16+', 'Kotlin']);
});

test('missing descriptions and languages have usable fallbacks', () => {
  const [project] = mergeRepositories([repo('plain', { description: null, language: null })]);
  assert.equal(project.language, 'Not specified');
  assert.match(project.summary, /Explore/);
  assert.match(project.details, /no public description/);
});

test('invalid, private, and foreign records are rejected; descriptions stay plain text', () => {
  assert.equal(normalizeRepository(repo('bad/name')), null);
  assert.equal(normalizeRepository(repo('malformed', { owner: { login: 42 } })), null);
  assert.equal(normalizeRepository(repo('private', { private: true })), null);
  assert.equal(normalizeRepository(repo('foreign', { owner: { login: 'someone-else' } })), null);
  assert.equal(normalizeRepository(repo('invalid', { updated_at: 'invalid' })), null);
  assert.equal(mergeRepositories([repo('safe', { description: '<img src=x onerror=alert(1)>' })])[0].summary, '<img src=x onerror=alert(1)>');
});

test('normal account performs exactly one request and a valid empty account is supported', async () => {
  let count = 0;
  const result = await fetchRepositories(async (url, options) => { count++; assert.match(url, /per_page=100&page=1/); assert.equal(options.credentials, 'omit'); assert.equal(options.headers.Authorization, undefined); return response([repo()]); });
  assert.equal(count, 1);
  assert.equal(result.length, 1);
  assert.deepEqual(await fetchRepositories(async () => response([])), []);
});

test('pagination loads every page and deduplicates repositories before publishing', async () => {
  const urls = [];
  const result = await fetchRepositories(async url => {
    urls.push(url);
    return urls.length === 1 ? response([repo('first')], '<https://api.github.com/users/kpranjal2047/repos?page=2>; rel="next"') : response([repo('first'), repo('second')]);
  });
  assert.equal(urls.length, 2);
  assert.match(urls[1], /page=2/);
  assert.deepEqual(result.map(r => r.name), ['first', 'second']);
});

test('rate limits, network failures, and malformed or partial results fail without retry', async () => {
  let calls = 0;
  await assert.rejects(fetchRepositories(async () => { calls++; return { ok: false, status: 403 }; }), error => error.status === 403);
  assert.equal(calls, 1);
  await assert.rejects(fetchRepositories(async () => { throw new Error('offline'); }), /offline/);
  await assert.rejects(fetchRepositories(async () => response({ message: 'unexpected' })), /Unexpected/);
  let pages = 0;
  await assert.rejects(fetchRepositories(async () => ++pages === 1 ? response([repo()], '<next>; rel="next"') : { ok: false, status: 500 }), /unavailable/);
});

test('validated cache works offline and malformed cache or unavailable storage is ignored', () => {
  const memory = storage();
  const now = Date.now();
  writeCache(memory, [repo()], now);
  assert.equal(readCache(memory, now).repositories[0].name, 'example');
  memory.setItem(CACHE_KEY, '{not-json');
  assert.equal(readCache(memory, now), null);
  memory.setItem(CACHE_KEY, JSON.stringify({ version: 1, fetchedAt: now, repositories: [repo('evil/path')] }));
  assert.equal(readCache(memory, now), null);
  memory.setItem(CACHE_KEY, JSON.stringify({ version: 1, fetchedAt: now + 3600000, repositories: [] }));
  assert.equal(readCache(memory, now), null);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readCache(blocked), null);
  assert.doesNotThrow(() => writeCache(blocked, [], now));
});
