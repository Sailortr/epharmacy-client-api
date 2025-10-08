import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectMemoryMongo, disconnectMemoryMongo, clearCollections } from './helpers/db.js';
import { loginAndGetToken } from './helpers/auth.js';
import Product from '../src/models/Product.js';

before(async () => {
  await connectMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

after(async () => {
  await disconnectMemoryMongo();
});

test('POST /api/reviews -> The same user cannot comment on the same product again.', async () => {
  const p = await Product.create({
    title: `Test Product ${Date.now()}`,
    brand: 'ACME',
    images: ['http://example.com/a.jpg'],
    tags: ['pain'],
    slug: `tp-${Date.now()}`,
    stock: 10,
    price: 19.9,
  });

  const token = await loginAndGetToken(app);

  const firstReview = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${token}`)
    .send({
      productId: String(p._id),
      rating: 5,
      comment: 'Great!',
    });

  assert.ok(
    [200, 201].includes(firstReview.status),
    `First review failed: ${firstReview.status} - ${JSON.stringify(firstReview.body)}`,
  );

  const secondReview = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${token}`)
    .send({
      productId: String(p._id),
      rating: 4,
      comment: 'I changed my mind',
    });

  assert.ok(
    [400, 409].includes(secondReview.status),
    `Second review wrong status: ${secondReview.status}`,
  );
});
