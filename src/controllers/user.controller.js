import User from '../models/User.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';

export async function getMe(req, res, next) {
  try {
    const id = req.user?._id || req.user?.id;
    if (!id) return badRequest(res, 'No user login');
    const me = await User.findById(id).select('-password').lean();
    if (!me) return notFound(res, 'User not found');

    return ok(res, me);
  } catch (e) {
    next(e);
  }
}

export async function updateMe(req, res, next) {
  try {
    const id = req.user?._id || req.user?.id;
    if (!id) return badRequest(res, 'No user login');

    const allowed = ['name', 'email', 'phone', 'avatar'];
    const $set = {};
    for (const k of allowed) if (req.body?.[k] !== undefined) $set[k] = req.body[k];

    const updated = await User.findByIdAndUpdate(id, { $set }, { new: true })
      .select('-password')
      .lean();

    return ok(res, updated || {});
  } catch (e) {
    next(e);
  }
}

export async function listUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').trim();

    const filter = {};
    if (q) filter.$text = { $search: q };

    const query = User.find(filter).select('-password').lean().sort({ createdAt: -1 });
    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}
