import createError from 'http-errors';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Store from '../models/store.model.js';

const toId = (id) => new mongoose.Types.ObjectId(id);

function sortMap(key) {
  switch (key) {
    case 'oldest':
      return { createdAt: 1 };
    case 'rating':
      return { rating: 1, createdAt: -1 };
    case '-rating':
      return { rating: -1, createdAt: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
}

export async function listCustomerReviews(req, res, next) {
  try {
    const { storeId, page, limit, sort } = req.query;
    const filter = { storeId: toId(storeId) };

    const skip = (page - 1) * limit;

    const [items, total, statsAgg] = await Promise.all([
      Review.find(filter)
        .sort(sortMap(sort))
        .skip(skip)
        .limit(limit)
        .populate({ path: 'userId', select: 'name email', options: { lean: true } })
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { storeId: toId(storeId) } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of statsAgg) distribution[row._id] = row.count;
    const ratingsSum = Object.entries(distribution).reduce((s, [r, c]) => s + Number(r) * c, 0);
    const avgRating = total ? Number((ratingsSum / total).toFixed(2)) : 0;

    res.json({
      status: 200,
      data: items.map((it) => ({
        id: it._id,
        rating: it.rating,
        comment: it.comment,
        createdAt: it.createdAt,
        user: it.userId ? { name: it.userId.name, email: it.userId.email } : null,
      })),
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        stats: { avgRating, distribution },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function createOrUpdateReview(req, res, next) {
  try {
    const userId = toId(req.user.id);
    const { storeId, rating, comment } = req.body;

    const store = await Store.findById(storeId).lean();
    if (!store || !store.isActive) throw createError(404, 'Store not found');

    const now = new Date();
    const existing = await Review.findOneAndUpdate(
      { userId, storeId: toId(storeId) },
      { $set: { rating, comment }, $setOnInsert: { createdAt: now } },
      { new: true, upsert: true },
    ).lean();

    res.status(200).json({
      status: 200,
      message: 'Review saved',
      data: {
        id: existing._id,
        storeId,
        rating: existing.rating,
        comment: existing.comment,
        updatedAt: existing.updatedAt,
      },
    });
  } catch (e) {
    if (e.code === 11000) return next(createError(409, 'Duplicate review'));
    next(e);
  }
}
