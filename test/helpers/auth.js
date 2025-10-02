// test/helpers/auth.js
import request from 'supertest';
import app from '../../src/app.js';

/**
 * Test için kullanıcı oluşturup access token döner.
 * Her çağrıda yeni email üretir -> çakışma olmaz.
 */
export async function getAccessToken() {
  const email = `user${Date.now()}@ex.com`;
  const password = 'Passw0rd!';

  // Register
  await request(app).post('/api/user/register').send({ name: 'U', email, password });

  // Login
  const res = await request(app).post('/api/user/login').send({ email, password });

  // API’ne göre token'ın yolu
  // (senin şeman: res.body?.data?.accessToken)
  return res.body?.data?.accessToken;
}
