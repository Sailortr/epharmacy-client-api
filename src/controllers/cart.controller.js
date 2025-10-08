import createError from 'http-errors';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import mongoose from 'mongoose';

function asId(id) {
  return new mongoose.Types.ObjectId(id);
}

function computeTotals(items) {
  const itemCount = items.reduce((s, it) => s + it.qty, 0);
  const subtotal = items.reduce((s, it) => s + it.qty * it.priceAtAdd, 0);
  return { itemCount, subtotal };
}

export async function getCart(req, res, next) {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId }).lean();

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
      cart = cart.toObject();
    }

    const productIds = cart.items.map((i) => i.productId);
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } }, { title: 1, brand: 1, form: 1 }).lean()
      : [];
    const map = new Map(products.map((p) => [String(p._id), p]));

    const items = cart.items.map((i) => ({
      productId: i.productId,
      qty: i.qty,
      priceAtAdd: i.priceAtAdd,
      product: map.get(String(i.productId)) || null,
    }));

    const totals = computeTotals(items);

    res.json({ status: 200, data: { items, totals } });
  } catch (e) {
    next(e);
  }
}

export async function updateCart(req, res, next) {
  try {
    const userId = req.user.id;
    const incoming = req.body.items;

    const ids = incoming.map((i) => asId(i.productId));
    const found = await Product.find({ _id: { $in: ids } }, { price: 1, stock: 1 }).lean();
    const pmap = new Map(found.map((p) => [String(p._id), p]));

    const updatedItems = [];

    for (const it of incoming) {
      const p = pmap.get(it.productId);
      if (!p) throw createError(404, `Product not found: ${it.productId}`);

      if (it.qty === 0) {
        continue;
      }

      if (p.stock < it.qty) {
        throw createError(409, `Insufficient stock for product ${it.productId}`);
      }

      updatedItems.push({
        productId: asId(it.productId),
        qty: it.qty,
        priceAtAdd: p.price,
      });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: updatedItems } },
      { new: true, upsert: true },
    ).lean();

    const totals = computeTotals(cart.items);

    res.json({ status: 200, message: 'Cart updated', data: { items: cart.items, totals } });
  } catch (e) {
    next(e);
  }
}

export async function checkout(req, res, next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id;

    let cart =
      (await Cart.findOne({ userId }).session(session)) ||
      (await Cart.findOne({ user: asId(userId) }).session(session));

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const productIds = cart.items.map((i) => i.productId || i.product);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);
    const pmap = new Map(products.map((p) => [String(p._id), p]));

    const orderItems = [];
    let orderTotal = 0;

    for (const it of cart.items) {
      const pid = String(it.productId || it.product);
      const qty = Number(it.qty ?? it.quantity ?? 0);
      const priceAtAdd = Number(it.priceAtAdd ?? it.price ?? 0);
      const p = pmap.get(pid);

      if (!p) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product not found: ${pid}` });
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid item quantity', productId: pid });
      }
      if (p.stock < qty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({ message: 'Insufficient stock', productId: pid });
      }

      orderItems.push({
        product: p._id,
        qty,
        price: priceAtAdd,
      });
      orderTotal += qty * priceAtAdd;
    }

    if (req.body?.clientTotal != null) {
      const diff = Math.abs(orderTotal - Number(req.body.clientTotal));
      if (diff > 0.01) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({ message: 'Total mismatch, please refresh your cart' });
      }
    }

    const bulkOps = cart.items.map((it) => {
      const pid = it.productId || it.product;
      const qty = Number(it.qty ?? it.quantity ?? 0);
      return {
        updateOne: {
          filter: { _id: pid, stock: { $gte: qty } },
          update: { $inc: { stock: -qty } },
        },
      };
    });
    const bulkRes = await Product.bulkWrite(bulkOps, { session });
    const modified =
      typeof bulkRes.modifiedCount === 'number' ? bulkRes.modifiedCount : bulkRes.result?.nModified;
    if (modified !== cart.items.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: 'Stock changed, please refresh the cart' });
    }

    const [orderDoc] = await Order.create(
      [
        {
          user: asId(userId),
          items: orderItems,
          total: orderTotal,
          status: 'paid',
        },
      ],
      { session },
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      status: 200,
      message: 'Checkout successful',
      data: { orderId: orderDoc.id, total: orderDoc.total },
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    if (e?.name === 'ValidationError') {
      return res.status(400).json({ message: e.message });
    }
    if (e?.status || e?.statusCode) {
      return res.status(e.status || e.statusCode).json({ message: e.message });
    }
    return res.status(400).json({ message: e.message || 'Checkout failed' });
  }
}
