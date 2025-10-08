import test, { before, after, afterEach } from 'node:test';
import request from 'supertest';
import { app } from '../src/app.js';
import { loginAndGetToken } from './helpers/auth.js';
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

test('GET /api/cart requires auth', async () => {
  const token = await loginAndGetToken(app);
  await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`).expect(200);
});
