import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isTest = process.env.NODE_ENV === 'test';

const passthrough = (_req, _res, next) => next();

export function createGeneralLimiter() {
  if (isTest) return passthrough;
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many requests' },
  });
}

export function createAuthLimiter() {
  if (isTest) return passthrough;
  return rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: 'Too many auth attempts' },
  });
}
