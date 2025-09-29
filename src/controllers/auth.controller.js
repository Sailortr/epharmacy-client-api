import createError from 'http-errors';
import User from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/passwords.js';
import { signAccess, signRefresh, hashToken, verifyRefresh } from '../utils/jwt.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import dayjs from 'dayjs';

export async function register(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) throw createError(409, 'Email already in use');
    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, phone, passwordHash });
    res.status(201).json({ status: 201, message: 'User created', data: { id: user._id } });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw createError(401, 'Invalid credentials');
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw createError(401, 'Invalid credentials');

    const payload = {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    res.status(200).json({
      status: 200,
      message: 'Successfully logged in an user!',
      data: { accessToken, refreshToken, user: { name: user.name, email: user.email } },
    });
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (token) {
      const { exp } = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      await TokenBlacklist.create({
        tokenHash: hashToken(token),
        expireAt: dayjs.unix(exp).toDate(),
        reason: 'logout',
      });
    }
    res.json({ status: 200, message: 'Logged out' });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {
  res.json({ status: 200, data: { name: req.user.name, email: req.user.email } });
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw createError(400, 'refreshToken is required');
    const payload = verifyRefresh(refreshToken);
    const accessToken = signAccess({
      sub: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    });
    res.json({ status: 200, data: { accessToken } });
  } catch (e) {
    next(createError(401, 'Invalid refresh token'));
  }
}
