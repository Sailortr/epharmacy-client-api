import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import Store from '../src/models/store.model.js';
import { connectMemoryMongo, disconnectMemoryMongo, clearCollections } from './helpers/db.js';

before(async () => {
  await connectMemoryMongo();
  await Store.syncIndexes();
});
afterEach(async () => {
  await clearCollections();
});
after(async () => {
  await disconnectMemoryMongo();
});

test('GET /api/stores/nearest returns nearby stores', async () => {
  await Store.create([
    {
      name: 'Pharmacy Hope',
      address: 'Shevchenka St, 100',
      phone: '0322-45-67-89',
      rating: 4,
      isActive: true,
      location: { type: 'Point', coordinates: [29.025, 41.043] },
    },
    {
      name: 'Aesculap',
      address: 'Peace Ave, 5',
      phone: '056-744-55-66',
      rating: 5,
      isActive: true,
      location: { type: 'Point', coordinates: [29.025, 41.043] },
    },
  ]);

  const res = await request(app)
    .get('/api/stores/nearest')
    .query({ lng: 29.025, lat: 41.043, max: 4000, limit: 5 });

  assert.equal(res.status, 200);
  const data = res.body?.data ?? res.body?.items ?? [];
  assert.ok(Array.isArray(data) && data.length >= 1);
  if (res.body?.meta?.count != null) {
    assert.equal(res.body.meta.count, data.length);
  }
});
