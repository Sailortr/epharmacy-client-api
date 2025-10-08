import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import Product from '../src/models/Product.js';
import { connectMemoryMongo, clearCollections, disconnectMemoryMongo } from './helpers/db.js';
import { loginAndGetToken } from './helpers/auth.js';

function expectOneOfStatus(res, allowed) {
  assert.ok(
    allowed.includes(res.status),
    `status ${res.status} not; one of the expected: ${allowed.join(', ')}`,
  );
}

function pickItems(body) {
  if (!body) return [];
  if (Array.isArray(body.items)) return body.items;
  if (body.data && Array.isArray(body.data.items)) return body.data.items;
  if (body.cart && Array.isArray(body.cart.items)) return body.cart.items;
  if (body.data?.cart && Array.isArray(body.data.cart.items)) {
    return body.data.cart.items;
  }
  return [];
}

function itemProductId(item) {
  if (!item) return null;
  if (typeof item.product === 'string') return item.product;
  if (item.product && typeof item.product._id === 'string') return item.product._id;
  if (typeof item.productId === 'string') return item.productId;
  if (item.productId && typeof item.productId._id === 'string') return item.productId._id;
  return null;
}

function matchItem(items, productId) {
  const pid = String(productId);
  return items.find((i) => String(itemProductId(i)) === pid);
}

before(async () => {
  await connectMemoryMongo();
});

afterEach(async () => {
  await clearCollections();
});

after(async () => {
  await disconnectMemoryMongo();
});

test('GET /api/cart -> 401 (no token)', async () => {
  const res = await request(app).get('/api/cart');
  assert.equal(res.status, 401);
});

test('PUT /api/cart/update -> 400 (productId format is invalid)', async () => {
  const token = await loginAndGetToken(app);

  const res = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: 'not-an-objectid', qty: 1 }] });

  assert.equal(res.status, 400);
});

test('PUT /api/cart/update -> 200 (qty:0 deletes the item, idempotent)', async () => {
  const token = await loginAndGetToken(app);

  const p = await Product.create({
    title: 'Valid Product',
    brand: 'ACME',
    images: ['http://example.com/a.jpg'],
    tags: ['t'],
    slug: `vp-${Date.now()}`,
    stock: 5,
    price: 10,
  });

  const add = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: String(p._id), qty: 1 }] });
  assert.equal(add.status, 200);

  let items = pickItems(add.body);
  let row = matchItem(items, p._id);
  assert.ok(row, 'The product must be added to the cart');

  const remove = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: String(p._id), qty: 0 }] });
  assert.equal(remove.status, 200);

  items = pickItems(remove.body);
  row = matchItem(items, p._id);
  assert.equal(row, undefined, 'qty:0 After that, the product must be deleted from the cart.');

  const removeAgain = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: String(p._id), qty: 0 }] });
  assert.equal(removeAgain.status, 200);

  const items2 = pickItems(removeAgain.body);
  const row2 = matchItem(items2, p._id);
  assert.equal(row2, undefined, 'tekrar qty:0 must be idempotent');
});

test('PUT /api/cart/update -> 400/409 (insufficient stock)', async () => {
  const token = await loginAndGetToken(app);

  const p = await Product.create({
    title: 'Low Stock',
    brand: 'ACME',
    images: ['http://example.com/l.jpg'],
    tags: ['t'],
    slug: `ls-${Date.now()}`,
    stock: 2,
    price: 15,
  });

  const res = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: String(p._id), qty: 5 }] });

  expectOneOfStatus(res, [400, 409]);
});

test('PUT /api/cart/update -> 400/404 (no product)', async () => {
  const token = await loginAndGetToken(app);
  const missing = '507f1f77bcf86cd799439011';

  const res = await request(app)
    .put('/api/cart/update')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ productId: missing, qty: 1 }] });

  expectOneOfStatus(res, [400, 404]);
});
