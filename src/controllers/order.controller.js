import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';

export async function createOrder(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    const { items = [], storeId = null, shipping = {}, paymentMethod = 'card' } = req.body || {};

    if (!items.length) return badRequest(res, 'Sepet boş');

    const total = items.reduce((s, it) => s + Number(it.price) * Number(it.qty || 1), 0);

    const order = await Order.create({
      user: userId || null,
      items,
      store: storeId,
      shipping,
      paymentMethod,
      total,
      status: 'pending',
    });

    return created(res, order);
  } catch (e) {
    next(e);
  }
}

export async function listMyOrders(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return badRequest(res, 'No user login');

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments({ user: userId }),
    ]);

    return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}

export async function listOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(),
    ]);

    return ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return notFound(res, 'Order not found');
    return ok(res, order);
  } catch (e) {
    next(e);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body || {};
    const allowed = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return badRequest(res, 'invalid status');

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true },
    ).lean();

    if (!order) return notFound(res, 'Order not found');
    return ok(res, order);
  } catch (e) {
    next(e);
  }
}
