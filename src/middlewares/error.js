export function notFound(_req, res, _next) {
  res.status(404).json({ status: 404, message: 'Not Found' });
}

export function errorHandler(err, req, res, _next) {
  const isTest = process.env.NODE_ENV === 'test';

  const isMongooseBufferTimeout =
    err?.name === 'MongooseError' &&
    typeof err?.message === 'string' &&
    err.message.includes('buffering timed out');

  const status = isMongooseBufferTimeout
    ? 503
    : err.status || err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  if (err?.code === 11000 && (err?.keyPattern?.email || err?.keyValue?.email)) {
    if (isTest) console.error('❌ DUPLICATE EMAIL (TEST):', err);
    return res.status(409).json({ status: 409, message: 'Email already in use' });
  }

  if (err?.name === 'ValidationError') {
    const msg =
      Object.values(err.errors || {})
        .map((e) => e.message)
        .join(', ') || 'Validation error';
    if (isTest) console.error('❌ VALIDATION (TEST):', err);
    return res.status(400).json({ status: 400, message: msg });
  }

  const message = isMongooseBufferTimeout
    ? 'Database temporarily unavailable'
    : err.expose || status < 500
      ? err.message || 'Error'
      : 'Internal Server Error';

  const body = { status, message };

  if (isTest) {
    if (err?.name) body.name = err.name;
    if (err?.code !== undefined) body.code = err.code;
    if (err?.keyPattern) body.keyPattern = err.keyPattern;
    if (err?.keyValue) body.keyValue = err.keyValue;
    if (err?.path) body.path = err.path;
    if (err?.stack) body.stack = err.stack;
    console.error('❌ ERROR_HANDLER (TEST):', {
      name: err.name,
      message: err.message,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
      path: err.path,
      errors: err.errors,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  res.status(status).json(body);
}
