import Store from '../models/store.model.js';

export async function listStores(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);
    const skip = Math.max((page - 1) * limit, 0);

    const q = (req.query.q || '').trim();

    const filter = { isActive: true };
    if (q) filter.$text = { $search: q };

    const query = Store.find(filter).lean();

    if (filter.$text) {
      query.select({ score: { $meta: 'textScore' } });
      query.sort({ score: { $meta: 'textScore' }, createdAt: -1 });
    } else {
      query.sort({ createdAt: -1 });
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit),
      Store.countDocuments(filter),
    ]);

    res.json({
      status: 200,
      data: items,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function nearestStores(req, res, next) {
  try {
    const lngN = parseFloat(req.query.lng);
    const latN = parseFloat(req.query.lat);
    const maxN = Math.max(parseInt(req.query.max, 10) || 4000, 1); // metre
    const limitN = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const unit = (req.query.unit || 'm').toLowerCase(); // 'm' | 'km'

    if ([lngN, latN, maxN, limitN].some(Number.isNaN)) {
      return res.status(400).json({ status: 400, message: 'Geçersiz koordinat/limit' });
    }

    const raw = await Store.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lngN, latN] },
          distanceField: 'distance',
          spherical: true,
          maxDistance: maxN,
          query: { isActive: true },
        },
      },
      { $limit: limitN },
      {
        $project: {
          name: 1,
          address: 1,
          phone: 1,
          rating: 1,
          location: 1,
          distance: 1,
        },
      },
    ]);

    const data = raw.map((doc) => {
      const meters = Math.round(doc.distance);
      const km = Math.round((doc.distance / 1000) * 100) / 100;
      return {
        ...doc,
        distanceMeters: meters,
        distanceKm: km,
        distance: unit === 'km' ? km : meters,
        distanceUnit: unit === 'km' ? 'km' : 'm',
      };
    });

    res.json({ status: 200, data, meta: { count: data.length } });
  } catch (err) {
    next(err);
  }
}
