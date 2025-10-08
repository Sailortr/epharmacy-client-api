import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import Product from '../src/models/Product.js';
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

test('GET /api/products lists products', async () => {
  await Product.create({
    title: 'Aspirin',
    brand: 'Square',
    images: ['http://example.com/a.jpg'],
    tags: ['Medicine'],
    slug: `aspirin-${Date.now()}`,
    stock: 10,
    price: 12.5,
  });

  const res = await request(app).get('/api/products?limit=5');
  assert.equal(res.status, 200);
  const list = res.body?.data ?? res.body?.items ?? [];
  assert.ok(Array.isArray(list) && list.length >= 1);
});
