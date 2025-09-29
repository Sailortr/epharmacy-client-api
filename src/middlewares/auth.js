import createError from 'http-errors';
import { verifyAccess } from '../utils/jwt.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { hashToken } from '../utils/jwt.js';

export async function requireAuth(req, _res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) throw createError(401, 'Missing token');

    const tokenHash = hashToken(token);
    const black = await TokenBlacklist.findOne({ tokenHash });
    if (black) throw createError(401, 'Token revoked');

    const payload = verifyAccess(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  } catch (e) {
    next(createError(401, 'Unauthorized'));
  }
}

export const requireRole =
  (roles = []) =>
  (req, _res, next) => {
    if (!roles.length || roles.includes(req.user?.role)) return next();
    return next(createError(403, 'Forbidden'));
  };
