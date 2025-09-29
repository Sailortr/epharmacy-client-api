import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const signAccess = (payload) =>
  jwt.sign(payload, env.jwt.access.secret, { expiresIn: env.jwt.access.expiresIn });

export const signRefresh = (payload) =>
  jwt.sign(payload, env.jwt.refresh.secret, { expiresIn: env.jwt.refresh.expiresIn });

export const verifyAccess = (token) => jwt.verify(token, env.jwt.access.secret);

export const verifyRefresh = (token) => jwt.verify(token, env.jwt.refresh.secret);

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
