export function notFound(req, res, next) {
  res.status(404).json({ status: 404, message: 'Not Found' });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.expose ? err.message : status >= 500 ? 'Internal Server Error' : err.message;
  res.status(status).json({ status, message });
}
