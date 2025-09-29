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

    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart || cart.items.length === 0) throw createError(400, 'Cart is empty');

    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).session(session);

    const pmap = new Map(products.map((p) => [String(p._id), p]));
    const orderItems = [];
    let orderTotal = 0;

    for (const it of cart.items) {
      const p = pmap.get(String(it.productId));
      if (!p) throw createError(404, `Product not found: ${it.productId}`);

      if (p.stock < it.qty) throw createError(409, `Insufficient stock for product ${p._id}`);

      orderTotal += it.qty * it.priceAtAdd;

      orderItems.push({
        productId: p._id,
        title: p.title,
        qty: it.qty,
        price: it.priceAtAdd,
      });
    }

    if (req.body?.clientTotal != null) {
      const diff = Math.abs(orderTotal - Number(req.body.clientTotal));
      if (diff > 0.01) throw createError(409, 'Total mismatch, please refresh your cart');
    }

    const paymentRef = 'PM-' + Math.random().toString(36).slice(2, 10).toUpperCase();

    const bulkOps = cart.items.map((it) => ({
      updateOne: {
        filter: { _id: it.productId, stock: { $gte: it.qty } },
        update: { $inc: { stock: -it.qty } },
      },
    }));
    const bulkRes = await Product.bulkWrite(bulkOps, { session });

    if (bulkRes.result && bulkRes.result.nModified !== cart.items.length) {
      throw createError(409, 'Stock changed, please refresh the cart');
    }

    const order = await Order.create(
      [
        {
          userId,
          items: orderItems,
          orderTotal,
          status: 'paid',
          paymentRef,
        },
      ],
      { session },
    );

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      status: 201,
      message: 'Checkout successful',
      data: {
        orderId: order[0]._id,
        paymentRef,
        orderTotal,
      },
    });
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    session.endSession();
  }
}
