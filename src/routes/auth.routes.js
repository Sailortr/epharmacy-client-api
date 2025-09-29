import { Router } from 'express';
import { register, login, logout, me, refresh } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validations/auth.schema.js';
import { requireAuth } from '../middlewares/auth.js';

const r = Router();

r.post('/user/register', validate(registerSchema), register);
r.post('/user/login', validate(loginSchema), login);
r.get('/user/logout', requireAuth, logout);
r.get('/user-info', requireAuth, me);
r.post('/auth/refresh', refresh);

export default r;
