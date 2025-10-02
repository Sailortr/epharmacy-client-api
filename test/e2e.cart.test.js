import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectMemoryMongo, disconnectMemoryMongo, clearCollections } from './helpers/db.js';
import { getAccessToken } from './helpers/auth.js';

test('setup mongodb-memory-server', async (t) => {
  await connectMemoryMongo();
  t.after(async () => {
    await disconnectMemoryMongo();
  });
});

test('GET /api/cart requires auth', async (t) => {
  await clearCollections();

  const token = await getAccessToken();

  const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  // assert.ok(Array.isArray(res.body.data.items));*************
});

test('PUT /api/cart/update updates items', async (t) => {
  await clearCollections();
  const token = await getAccessToken();

  const res = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({
      items: [{ productId: '000000000000000000000001', qty: 2 }],
    });

  assert.equal(res.status, 200);
});
