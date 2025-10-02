import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { clearCollections } from './helpers/db.js';
import app from '../src/app.js';
import Product from '../src/models/Product.js';

test('GET /api/products lists products', async () => {
  await clearCollections();
  await Product.create({
    title: 'Aspirin',
    brand: 'Square',
    images: ['http://example.com/a.jpg'],
    tags: ['Medicine'],
    slug: 'aspirin-0',
    stock: 10,
    price: 12.5,
  });

  const res = await request(app).get('/api/products?limit=5');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length >= 1);
});
