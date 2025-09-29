import 'dotenv/config';

const list = (val, fallback = []) =>
  val
    ? val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : fallback;

export const env = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  mongoUri: process.env.MONGODB_URI,
  corsOrigin: list(process.env.CORS_ORIGIN, ['http://localhost:5173']),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.RATE_LIMIT_MAX || 120),
    authMax: Number(process.env.RATE_LIMIT_AUTH_MAX || 20),
  },
  isProd: (process.env.NODE_ENV || 'development') === 'production',
};
