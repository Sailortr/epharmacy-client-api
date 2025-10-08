import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

const ACCESS_SECRET = env?.jwt?.access?.secret || 'test-access-secret';
const REFRESH_SECRET = env?.jwt?.refresh?.secret || 'test-refresh-secret';
const ACCESS_EXPIRES = env?.jwt?.access?.expiresIn || '15m';
const REFRESH_EXPIRES = env?.jwt?.refresh?.expiresIn || '30d';

export const signAccess = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });

export const signRefresh = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

export const verifyAccess = (token) => jwt.verify(token, ACCESS_SECRET);
export const verifyRefresh = (token) => jwt.verify(token, REFRESH_SECRET);

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
