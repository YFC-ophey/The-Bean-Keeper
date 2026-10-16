import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';
import { optionalAuth, requireAuth } from './auth';

function response() {
  const state: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) { state.status = code; return this; },
    json(body: unknown) { state.body = body; return this; },
  } as unknown as Response;
  return { res, state };
}

test('optional auth passes guests without an Authorization header', async () => {
  const req = { headers: {} } as Request;
  const { res, state } = response();
  let passed = false;
  await optionalAuth(req, res, () => { passed = true; });
  assert.equal(passed, true);
  assert.equal(state.status, undefined);
});

test('optional auth rejects malformed supplied credentials rather than treating them as guests', async () => {
  const req = { headers: { authorization: 'Bearer first second' } } as Request;
  const { res, state } = response();
  let passed = false;
  await optionalAuth(req, res, () => { passed = true; });
  assert.equal(passed, false);
  assert.equal(state.status, 401);
});

test('required auth rejects requests without credentials', async () => {
  const req = { headers: {} } as Request;
  const { res, state } = response();
  await requireAuth(req, res, () => { throw new Error('must not pass'); });
  assert.equal(state.status, 401);
});
