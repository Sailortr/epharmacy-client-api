export const ok = (res, data = [], meta) =>
  res.json(meta ? { status: 200, data, meta } : { status: 200, data });

export const created = (res, data = {}) => res.status(201).json({ status: 201, data });

export const badRequest = (res, message = 'Bad Request') =>
  res.status(400).json({ status: 400, message });

export const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ status: 401, message });

export const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ status: 403, message });

export const notFound = (res, message = 'Not Found') =>
  res.status(404).json({ status: 404, message });

export const serverError = (res, error) =>
  res.status(500).json({ status: 500, message: error?.message || 'Server Error' });
