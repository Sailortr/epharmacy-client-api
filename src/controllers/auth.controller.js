import createError from 'http-errors';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { hashPassword, comparePassword } from '../utils/passwords.js';
import { signAccess, signRefresh, hashToken, verifyRefresh } from '../utils/jwt.js';

const isTest = process.env.NODE_ENV === 'test';

async function waitDbReady(timeoutMs = 4000) {
  if (mongoose.connection?.readyState === 1) return;
  await Promise.race([
    mongoose.connection.asPromise?.() ?? Promise.resolve(),
    new Promise((_, rej) =>
      setTimeout(() => rej(createError(503, 'Database not ready')), timeoutMs),
    ),
  ]);
}

async function maybeSendWelcomeEmail(user) {
  try {
    if (isTest) return;
  } catch {}
}

export async function register(req, res, next) {
  try {
    await waitDbReady();
    if (isTest) console.log('REGISTER req.body DEBUG ->', req.body);

    const { name, email, phone, password, confirmPassword, role } = req.body || {};

    if (!name || !email || !password) {
      throw createError(400, 'name, Email and password are required');
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      throw createError(400, 'confirmPassword does not match password');
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail }).lean();
    if (exists) throw createError(409, 'Email already in use');

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone,
      passwordHash,
      ...(role ? { role } : {}),
    });

    res.status(201).json({ status: 201, message: 'User created', data: { id: user._id } });

    queueMicrotask(() => {
      maybeSendWelcomeEmail(user).catch(() => {});
    });
  } catch (e) {
    if (isTest) {
      console.error('REGISTER ERROR (TEST DIAGNOSTIC):', {
        name: e?.name,
        message: e?.message,
        code: e?.code,
        keyPattern: e?.keyPattern,
        keyValue: e?.keyValue,
        path: e?.path,
        stack: e?.stack,
      });
    }
    if (e?.code === 11000 && (e?.keyPattern?.email || e?.keyValue?.email)) {
      return next(createError(409, 'Email already in use'));
    }
    return next(e);
  }
}

export async function login(req, res, next) {
  try {
    await waitDbReady();
    const { email, password } = req.body || {};
    if (!email || !password) throw createError(400, 'Email and password are required');

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw createError(401, 'Invalid credentials');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw createError(401, 'Invalid credentials');

    const payload = {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };

    let accessToken, refreshToken;
    try {
      accessToken = signAccess(payload);
      refreshToken = signRefresh(payload);
    } catch (err) {
      if (isTest) console.error('TOKEN SIGN ERROR:', err?.message);
      throw createError(500, 'Token signing failed');
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully logged in an user!',
      data: {
        accessToken,
        refreshToken,
        user: { name: user.name, email: user.email },
      },
    });
  } catch (e) {
    return next(e);
  }
}

export async function logout(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (token) {
      try {
        const [, payloadB64] = token.split('.');
        const { exp } = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
        await TokenBlacklist.create({
          tokenHash: hashToken(token),
          expireAt: dayjs.unix(exp).toDate(),
          reason: 'logout',
        });
      } catch (err) {
        if (isTest) console.warn('LOGOUT decode warning:', err?.message);
      }
    }

    return res.json({ status: 200, message: 'Logged out' });
  } catch (e) {
    return next(e);
  }
}

export async function me(req, res, next) {
  try {
    return res.json({
      status: 200,
      data: { name: req.user?.name, email: req.user?.email },
    });
  } catch (e) {
    return next(e);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw createError(400, 'refreshToken is required');

    let payload;
    try {
      payload = verifyRefresh(refreshToken);
    } catch {
      throw createError(401, 'Invalid refresh token');
    }

    let accessToken;
    try {
      accessToken = signAccess({
        sub: payload.sub,
        role: payload.role,
        email: payload.email,
        name: payload.name,
      });
    } catch (err) {
      if (isTest) console.error('ACCESS SIGN ERROR:', err?.message);
      throw createError(500, 'Token signing failed');
    }

    return res.json({ status: 200, data: { accessToken } });
  } catch (e) {
    return next(e);
  }
}
