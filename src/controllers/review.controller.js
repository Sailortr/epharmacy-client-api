import createError from 'http-errors';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

const toId = (id) => new mongoose.Types.ObjectId(id);

function sortMap(key) {
  switch (key) {
    case 'oldest':
      return { createdAt: 1, _id: 1 };
    case 'rating':
      return { rating: 1, createdAt: -1, _id: 1 };
    case '-rating':
      return { rating: -1, createdAt: -1, _id: 1 };
    case 'newest':
    default:
      return { createdAt: -1, _id: 1 };
  }
}

export async function listCustomerReviews(req, res, next) {
  try {
    let { productId, page = 1, limit = 10, sort } = req.query;
    if (!productId || !mongoose.isValidObjectId(productId)) {
      throw createError(400, 'Invalid productId');
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (pageNum - 1) * perPage;
    const filter = { productId: toId(productId) };
    const [items, total, statsAgg] = await Promise.all([
      Review.find(filter)
        .sort(sortMap(sort))
        .skip(skip)
        .limit(perPage)
        .populate({ path: 'userId', select: 'name email', options: { lean: true } })
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([{ $match: filter }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
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
        page: pageNum,
        limit: perPage,
        total,
        pages: Math.ceil(total / perPage),
        stats: { avgRating, distribution },
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function createOrUpdateReview(req, res, next) {
  try {
    const productIdRaw = req.body.productId ?? req.body.product;
    const ratingRaw = req.body.rating ?? req.body.rate;
    const comment = req.body.comment;

    if (!productIdRaw || !mongoose.isValidObjectId(productIdRaw)) {
      throw createError(400, 'Invalid productId');
    }

    const r = Number(ratingRaw);
    if (!Number.isFinite(r) || r < 1 || r > 5) {
      throw createError(400, 'Rating must be between 1 and 5');
    }

    const userId = toId(req.user.id);

    const product = await Product.findById(productIdRaw).lean();
    if (!product) throw createError(404, 'Product not found');

    const existing = await Review.findOne({ userId, productId: product._id }).lean();
    if (existing) throw createError(409, 'You have already reviewed this product');

    const safeComment = typeof comment === 'string' ? comment.trim() : undefined;

    const created = await Review.create({
      userId,
      productId: product._id,
      ...(product.storeId ? { storeId: product.storeId } : {}),
      rating: r,
      ...(safeComment ? { comment: safeComment } : {}),
    });

    res.status(201).json({
      status: 201,
      message: 'Review created',
      data: {
        id: created._id,
        productId: String(product._id),
        rating: created.rating,
        comment: created.comment ?? null,
        createdAt: created.createdAt,
      },
    });

    Product.updateOne({ _id: product._id }, [
      {
        $set: {
          ratingCount: { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
          ratingAverage: {
            $round: [
              {
                $cond: [
                  { $gt: [{ $ifNull: ['$ratingCount', 0] }, 0] },
                  {
                    $divide: [
                      {
                        $add: [
                          {
                            $multiply: [
                              { $ifNull: ['$ratingAverage', 0] },
                              { $ifNull: ['$ratingCount', 0] },
                            ],
                          },
                          r,
                        ],
                      },
                      { $add: [{ $ifNull: ['$ratingCount', 0] }, 1] },
                    ],
                  },
                  r,
                ],
              },
              2,
            ],
          },
        },
      },
    ]).catch(() => {});
  } catch (e) {
    if (e?.code === 11000) return next(createError(409, 'You have already reviewed this product'));
    next(e);
  }
}
