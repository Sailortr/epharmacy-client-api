import { Router } from 'express';
import { getMe, updateMe, listUsers } from '../controllers/user.controller.js';

const r = Router();

r.get('/users/me', getMe);
r.patch('/users/me', updateMe);
r.get('/users', listUsers);

export default r;
