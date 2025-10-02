import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectMemoryMongo, disconnectMemoryMongo, clearCollections } from './helpers/db.js';
import Store from '../src/models/store.model.js';

test('setup mongodb-memory-server', async (t) => {
  await connectMemoryMongo();

  // test bitince kapat
  t.after(async () => {
    await disconnectMemoryMongo();
  });
});

test('GET /api/stores/nearest returns nearby stores', async (t) => {
  await clearCollections();

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

  await mongoose.connection.collection('stores').createIndex({ location: '2dsphere' });

  const res = await request(app)
    .get('/api/stores/nearest')
    .query({ lng: 29.025, lat: 41.043, max: 4000, limit: 5 });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 1);
  assert.equal(res.body.meta.count, res.body.data.length);
  assert.equal(typeof res.body.data[0].distance, 'number');
});
