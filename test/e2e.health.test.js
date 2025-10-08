import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMemoryMongo, disconnectMemoryMongo, clearCollections } from './helpers/db.js';

before(async () => {
  await connectMemoryMongo();
});
afterEach(async () => {
  await clearCollections();
});
after(async () => {
  await disconnectMemoryMongo();
});

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});
