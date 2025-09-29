import createError from 'http-errors';
import Product from '../models/Product.js';

function buildSort(sort) {
  const map = {
    price: { price: 1 },
    '-price': { price: -1 },
    title: { title: 1 },
    '-title': { title: -1 },
    createdAt: { createdAt: 1 },
    '-createdAt': { createdAt: -1 },
  };
  return map[sort] || { createdAt: 1 };
}

export async function listProducts(req, res, next) {
  try {
    const { q, brand, tag, rx, minPrice, maxPrice, page, limit, sort } = req.query;

    const filter = {};
    if (q) {
      filter.$text = { $search: q };
    }
    if (brand) filter.brand = brand;
    if (typeof rx === 'boolean') filter.rxRequired = rx;
    if (tag) filter.tags = tag;
    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const sortObj = buildSort(sort);

    const query = Product.find(filter).lean();
    if (filter.$text) query.select({ score: { $meta: 'textScore' } });
    const [items, total] = await Promise.all([
      query
        .sort(filter.$text ? { score: { $meta: 'textScore' }, ...sortObj } : sortObj)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      status: 200,
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    next(e);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await Product.findById(id).lean();
    if (!doc) throw createError(404, 'Product not found');
    res.json({ status: 200, data: doc });
  } catch (e) {
    next(e);
  }
}
