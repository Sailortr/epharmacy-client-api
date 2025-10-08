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

test('POST /api/user/register -> 400 (name/email/password is missing)', async () => {
  const res = await request(app)
    .post('/api/user/register')
    .send({ email: 'a@b.com', password: 'Passw0rd!' });

  assert.equal(res.status, 400);
});

test('POST /api/user/register -> 400 (confirmPassword mismatch)', async () => {
  const res = await request(app).post('/api/user/register').send({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Different123!',
  });

  assert.equal(res.status, 400);
});

test('POST /api/user/register -> 409 (duplicate email)', async () => {
  const body = {
    name: 'Bob',
    email: 'bob@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  };
  await request(app).post('/api/user/register').send(body).expect(201);

  const res2 = await request(app).post('/api/user/register').send(body);
  assert.equal(res2.status, 409);
});

test('POST /api/user/login -> 401 (no email)', async () => {
  const res = await request(app)
    .post('/api/user/login')
    .send({ email: 'nope@example.com', password: 'Passw0rd!' });

  assert.equal(res.status, 401);
});

test('POST /api/user/login -> 401 (wrong password)', async () => {
  const user = {
    name: 'Carl',
    email: 'carl@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  };
  await request(app).post('/api/user/register').send(user).expect(201);

  const res = await request(app)
    .post('/api/user/login')
    .send({ email: user.email, password: 'Wrong123!' });

  assert.equal(res.status, 401);
});

test('POST /api/auth/refresh -> 200 (valid refresh; new access comes)', async () => {
  const u = {
    name: 'Dana',
    email: 'dana@example.com',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  };
  await request(app).post('/api/user/register').send(u).expect(201);

  const login = await request(app)
    .post('/api/user/login')
    .send({ email: u.email, password: u.password })
    .expect(200);

  const refreshToken =
    login.body?.data?.refreshToken ||
    login.body?.refreshToken ||
    login.body?.tokens?.refresh?.token;

  assert.ok(refreshToken, 'refreshToken came empty');

  const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200);

  const newAccess =
    refreshed.body?.data?.accessToken ||
    refreshed.body?.accessToken ||
    refreshed.body?.tokens?.access?.token;

  assert.ok(newAccess, 'new accessToken is empty');

  const me = await request(app).get('/api/cart').set('Authorization', `Bearer ${newAccess}`);

  assert.equal(me.status, 200);
});

test('POST /api/auth/refresh -> 401 (corrupt/incorrectly signed refresh)', async () => {
  const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'not-a-jwt' });

  assert.equal(res.status, 401);
});
