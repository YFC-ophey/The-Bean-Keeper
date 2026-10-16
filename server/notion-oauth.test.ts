import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateTemplateDatabaseToUserWorkspace } from './notion-oauth';

test('reuses a persisted coffee database without creating another', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('/databases/existing')) {
      return Response.json({ id: 'existing', data_sources: [{ id: 'source' }] });
    }
    if (url.endsWith('/data_sources/source')) {
      return Response.json({ properties: {
        Roaster: { type: 'rich_text' },
        'Front Photo': { type: 'url' },
        'App ID': { type: 'rich_text' },
      } });
    }
    throw new Error(`Unexpected Notion call: ${url}`);
  };
  try {
    assert.equal(await duplicateTemplateDatabaseToUserWorkspace('provider-token', undefined, 'existing'), 'existing');
    assert.deepEqual(calls.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('searches later Notion pages before creating a coffee database', async () => {
  const originalFetch = globalThis.fetch;
  let searchCalls = 0;
  let createCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/search')) {
      searchCalls++;
      const body = JSON.parse(String(init?.body));
      return Response.json(body.start_cursor
        ? { results: [{ object: 'data_source', id: 'source', parent: { database_id: 'existing' } }], has_more: false, next_cursor: null }
        : { results: [], has_more: true, next_cursor: 'next-page' });
    }
    if (url.endsWith('/databases/existing')) {
      return Response.json({ id: 'existing', data_sources: [{ id: 'source' }] });
    }
    if (url.endsWith('/data_sources/source')) {
      return Response.json({ properties: {
        Roaster: { type: 'rich_text' },
        'Front Photo': { type: 'url' },
        'App ID': { type: 'rich_text' },
      } });
    }
    if (url.endsWith('/databases') && init?.method === 'POST') createCalls++;
    throw new Error(`Unexpected Notion call: ${url}`);
  };
  try {
    assert.equal(await duplicateTemplateDatabaseToUserWorkspace('provider-token'), 'existing');
    assert.equal(searchCalls, 2);
    assert.equal(createCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not replace an inaccessible linked database with an empty one', async () => {
  const originalFetch = globalThis.fetch;
  let createCalls = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith('/databases/previous')) {
      return Response.json({ code: 'object_not_found', message: 'Not shared' }, { status: 404 });
    }
    if (url.endsWith('/search')) {
      return Response.json({ results: [], has_more: false, next_cursor: null });
    }
    if (init?.method === 'POST') createCalls++;
    throw new Error(`Unexpected Notion call: ${url}`);
  };
  try {
    await assert.rejects(
      duplicateTemplateDatabaseToUserWorkspace('provider-token', undefined, 'previous'),
      /Previously linked Notion database is unavailable/,
    );
    assert.equal(createCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
