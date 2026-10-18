import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { Request, Response } from 'express';

const OWNER_ID = '2f10d615-6739-486b-97e4-752136a59499';
const OTHER_ID = '01e64cd2-367d-4ed9-9799-3955d9e7fbbe';
const originalFetch = globalThis.fetch;

process.env.SUPABASE_URL = 'https://owner-auth-test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OWNER_SUPABASE_USER_ID = OWNER_ID;
process.env.NOTION_API_KEY = 'server-only-notion-key';
process.env.NOTION_DATABASE_ID = 'existing-owner-database';

let notionCalls = 0;
let connectionWrites = 0;
let otherConnection: Record<string, unknown> | null = null;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.endsWith('/auth/v1/user')) {
    const authorization = new Headers(init?.headers).get('authorization');
    const id = authorization === 'Bearer owner-jwt' ? OWNER_ID : OTHER_ID;
    return Response.json({ id, email: 'untrusted@example.com', app_metadata: {}, user_metadata: {}, aud: 'authenticated' });
  }
  if (url.includes('/rest/v1/notion_connections')) {
    if (init?.method && init.method !== 'GET') connectionWrites++;
    return Response.json(otherConnection);
  }
  if (url.includes('api.notion.com')) notionCalls++;
  throw new Error(`Unexpected external request: ${url}`);
};

const { getOwnerNotionAuthState } = await import('./middleware/auth');
const { registerNotionOAuthRoutes } = await import('./notion-oauth-routes');

async function invokeRoute(app: express.Express, path: string, headers: Record<string, string>, body?: unknown) {
  const route = (app as any)._router.stack.find((layer: any) => layer.route?.path === path)?.route;
  assert.ok(route, `Missing route ${path}`);
  const req = { headers: { authorization: headers.Authorization }, body } as Request;
  const result: { status: number; body?: any } = { status: 200 };
  const res = {
    status(code: number) { result.status = code; return this; },
    json(value: unknown) { result.body = value; return this; },
  } as Response;
  for (const layer of route.stack) {
    const passed = await new Promise<boolean>((resolve, reject) => {
      let nextCalled = false;
      try {
        Promise.resolve(layer.handle(req, res, () => { nextCalled = true; }))
          .then(() => resolve(nextCalled), reject);
      } catch (error) { reject(error); }
    });
    if (!passed) break;
  }
  return result;
}

test('owner identity requires a valid exact Supabase UUID and server Notion credentials', () => {
  assert.equal(getOwnerNotionAuthState(OTHER_ID), null);
  assert.equal(getOwnerNotionAuthState(OWNER_ID)?.accessToken, 'server-only-notion-key');
  process.env.OWNER_SUPABASE_USER_ID = 'not-a-uuid';
  assert.equal(getOwnerNotionAuthState(OWNER_ID), null);
  process.env.OWNER_SUPABASE_USER_ID = OWNER_ID;
  delete process.env.NOTION_API_KEY;
  assert.equal(getOwnerNotionAuthState(OWNER_ID), null);
  process.env.NOTION_API_KEY = 'server-only-notion-key';
});

test('owner hydrates on first and repeated requests without persisting either Notion token', async () => {
  const app = express();
  registerNotionOAuthRoutes(app);
  try {
    const ownerHeaders = { Authorization: 'Bearer owner-jwt' };
    for (let i = 0; i < 2; i++) {
      const me = await invokeRoute(app, '/api/auth/me', ownerHeaders);
      assert.equal(me.status, 200);
      assert.deepEqual(me.body, {
        authenticated: true,
        notionLinked: true,
        workspaceName: 'Owner collection',
        databaseId: 'existing-owner-database',
        isOwner: true,
      });
    }
    const link = await invokeRoute(app, '/api/auth/notion/link-provider-token', ownerHeaders,
      { providerToken: 'provider-token-must-not-be-saved' });
    assert.equal(link.status, 200);
    assert.equal(link.body.isOwner, true);
    assert.equal(connectionWrites, 0);
    assert.equal(notionCalls, 0);

    const other = await invokeRoute(app, '/api/auth/me', { Authorization: 'Bearer other-jwt' });
    assert.equal(other.status, 200);
    assert.deepEqual(other.body, {
      authenticated: true,
      notionLinked: false,
      isOwner: false,
    });

    // A stale row cannot promote a different verified Supabase user to owner.
    otherConnection = {
      notion_access_token: 'user-provider-token',
      notion_database_id: 'other-database',
      workspace_name: 'Other workspace',
      is_owner: true,
    };
    const stale = await invokeRoute(app, '/api/auth/me', { Authorization: 'Bearer other-jwt' });
    assert.equal(stale.status, 200);
    assert.equal(stale.body.notionLinked, true);
    assert.equal(stale.body.isOwner, false);

    for (const missingVariable of ['NOTION_API_KEY', 'NOTION_DATABASE_ID'] as const) {
      const configuredValue = process.env[missingVariable];
      delete process.env[missingVariable];
      try {
        const unavailable = await invokeRoute(app, '/api/auth/me', ownerHeaders);
        assert.equal(unavailable.status, 503);
        assert.equal(unavailable.body.error, 'Owner Notion configuration incomplete');
        const refusedLink = await invokeRoute(app, '/api/auth/notion/link-provider-token', ownerHeaders,
          { providerToken: 'provider-token-must-not-be-saved' });
        assert.equal(refusedLink.status, 503);
        assert.equal(refusedLink.body.error, 'Owner Notion configuration incomplete');
        assert.equal(connectionWrites, 0);
        assert.equal(notionCalls, 0);
      } finally {
        process.env[missingVariable] = configuredValue;
      }
    }
  } finally {
    otherConnection = null;
    globalThis.fetch = originalFetch;
  }
});
