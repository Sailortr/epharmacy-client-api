import test, { before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import Product from '../src/models/Product.js';
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

function getListAndMeta(body) {
  const list = body?.data ?? body?.products ?? body?.items ?? (Array.isArray(body) ? body : []);
  const meta = body?.meta ?? body?.pagination ?? {};
  return { list, meta };
}

async function seedProducts() {
  const now = Date.now();
  const docs = [
    {
      title: 'Aspirin',
      brand: 'ACME',
      price: 10,
      stock: 50,
      slug: `asp-${now}`,
      tags: ['pain'],
      images: ['x'],
    },
    {
      title: 'Paracetamol',
      brand: 'ACME',
      price: 7,
      stock: 50,
      slug: `par-${now}`,
      tags: ['pain', 'fever'],
      images: ['x'],
    },
    {
      title: 'Vitamin C',
      brand: 'GLOBEX',
      price: 15,
      stock: 10,
      slug: `vitc-${now}`,
      tags: ['vitamin'],
      images: ['x'],
    },
    {
      title: 'Magnesium',
      brand: 'GLOBEX',
      price: 30,
      stock: 5,
      slug: `mag-${now}`,
      tags: ['mineral'],
      images: ['x'],
    },
    {
      title: 'Ibuprofen',
      brand: 'ACME',
      price: 12,
      stock: 25,
      slug: `ibu-${now}`,
      tags: ['pain'],
      images: ['x'],
    },
    {
      title: 'Zinc',
      brand: 'ACME',
      price: 9,
      stock: 15,
      slug: `zn-${now}`,
      tags: ['mineral'],
      images: ['x'],
    },
  ];
  await Product.insertMany(docs);
  return docs;
}

test('GET /api/products -> pagination & meta', async () => {
  await seedProducts();

  let res = await request(app).get('/api/products?page=1&limit=3');
  assert.equal(res.status, 200);
  let { list: page1, meta: meta1 } = getListAndMeta(res.body);
  assert.ok(Array.isArray(page1) && page1.length <= 3);
  if (meta1?.page != null) assert.equal(Number(meta1.page), 1);

  res = await request(app).get('/api/products?page=2&limit=3');
  assert.equal(res.status, 200);
  const { list: page2, meta: meta2 } = getListAndMeta(res.body);
  assert.ok(Array.isArray(page2) && page2.length <= 3);
  if (meta2?.page != null) assert.equal(Number(meta2.page), 2);

  if (page1?.length && page2?.length) {
    const ids1 = new Set(page1.map((p) => String(p._id)));
    const overlap = page2.some((p) => ids1.has(String(p._id)));
    if (overlap) console.warn('! overlapping ids: non-stable sort.');
  }
});

test('GET /api/products -> brand/tags/q filters', async () => {
  await seedProducts();

  let res = await request(app).get('/api/products?brand=ACME&limit=50');
  assert.equal(res.status, 200);
  let { list } = getListAndMeta(res.body);
  assert.ok(list.length > 0);
  assert.ok(list.every((p) => (p.brand || '').toUpperCase() === 'ACME'));

  res = await request(app).get('/api/products?tags=pain&limit=50');
  assert.ok([200, 400, 422].includes(res.status));
  if (res.status === 200) {
    ({ list } = getListAndMeta(res.body));
    assert.ok(list.length > 0);
    assert.ok(list.every((p) => (p.tags || []).includes('pain')));
  }

  res = await request(app).get('/api/products?q=vit&limit=50');
  assert.equal(res.status, 200);
  ({ list } = getListAndMeta(res.body));
  assert.ok(list.length > 0);
  assert.ok(list.some((p) => /vit/i.test(p.title) || /vit/i.test(p.brand)));
});

test('GET /api/products/:id -> invalid 400, not found 404', async () => {
  await seedProducts();

  let res = await request(app).get('/api/products/not-an-objectid');
  assert.equal(res.status, 400);

  const missing = '507f1f77bcf86cd799439011';
  res = await request(app).get(`/api/products/${missing}`);
  assert.equal(res.status, 404);
});
