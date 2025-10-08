import request from 'supertest';

export const loginAndGetToken = async (app, overrides = {}) => {
  const unique = Date.now();
  const user = {
    name: 'Test User',
    email: `test${unique}@example.com`,
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
    role: 'customer',
    ...overrides,
  };

  const reg = await request(app)
    .post('/api/user/register')
    .set('Content-Type', 'application/json')
    .send(user);

  if (reg.status >= 400) {
    console.log('REGISTER BODY DEBUG:', reg.body);
    throw new Error(`Register failed -> ${reg.status}`);
  }

  const login = await request(app)
    .post('/api/user/login')
    .set('Content-Type', 'application/json')
    .send({ email: user.email, password: user.password });

  if (login.status >= 400) {
    console.log('LOGIN BODY DEBUG:', login.body);
    throw new Error(`Login failed -> ${login.status}`);
  }

  const token = login.body?.data?.accessToken || login.body?.accessToken || login.body?.token;

  if (!token) {
    console.log('LOGIN NO TOKEN DEBUG:', login.body);
    throw new Error('Login succeeded but token not found');
  }

  return token;
};
