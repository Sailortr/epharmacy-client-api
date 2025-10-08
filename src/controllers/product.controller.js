import createError from 'http-errors';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

function buildSort(sort) {
  const map = {
    price: { price: 1, _id: 1 },
    '-price': { price: -1, _id: 1 },
    title: { title: 1, _id: 1 },
    '-title': { title: -1, _id: 1 },
    createdAt: { createdAt: 1, _id: 1 },
    '-createdAt': { createdAt: -1, _id: 1 },
  };
  return map[sort] || { createdAt: -1, _id: 1 }; 
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return undefined;
}

export async function listProducts(req, res, next) {
  try {
    let {
      q,
      brand,
      tags,
      tag, 
      rx,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (pageNum - 1) * perPage;

    const filter = {};

    if (q && String(q).trim()) {
      const rxQ = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { title: rxQ }, 
        { name: rxQ }, 
        { brand: rxQ },
        { description: rxQ },
      ];
    }

    if (brand) filter.brand = brand;

    const tagValue = tags ?? tag;
    if (tagValue) filter.tags = tagValue;

    const rxParsed = parseBool(rx);
    if (typeof rxParsed === 'boolean') filter.rxRequired = rxParsed;

    if (minPrice != null || maxPrice != null) {
      filter.price = {};
      if (minPrice != null) filter.price.$gte = Number(minPrice);
      if (maxPrice != null) filter.price.$lte = Number(maxPrice);
    }

    const sortObj = buildSort(sort);

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(perPage).lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      status: 200,
      data: items,
      meta: {
        page: pageNum,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw createError(400, 'Invalid product id');
    const doc = await Product.findById(id).lean();
    if (!doc) throw createError(404, 'Product not found');
    res.json({ status: 200, data: doc });
  } catch (e) {
    next(e);
  }
}
