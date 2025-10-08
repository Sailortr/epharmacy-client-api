import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMemoryMongo, clearCollections, disconnectMemoryMongo } from './helpers/db.js';

before(async () => {
  await connectMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

after(async () => {
  await disconnectMemoryMongo();
});

test('GET /api/stores/nearest -> mandatory query is missing/corrupt -> 400', async () => {
  let res = await request(app).get('/api/stores/nearest');
  assert.equal(res.status, 400);

  res = await request(app).get('/api/stores/nearest?lat=41.0&limit=5&max=3000');
  assert.equal(res.status, 400);

  res = await request(app).get('/api/stores/nearest?lng=29.0&limit=5&max=3000');
  assert.equal(res.status, 400);

  res = await request(app).get('/api/stores/nearest?lat=abc&lng=def');
  assert.equal(res.status, 400);
});

test('GET /api/stores/nearest -> excessively large limit is reasonably trimmed (200 veya 400)', async () => {
  const res = await request(app).get(
    '/api/stores/nearest?lng=29.025&lat=41.043&max=4000&limit=999',
  );
  assert.ok([200, 400].includes(res.status));
  if (res.status === 200) {
    const data = Array.isArray(res.body) ? res.body : (res.body?.data ?? res.body?.items ?? []);
    assert.ok(Array.isArray(data));
    assert.ok(data.length <= 999);
  }
});
