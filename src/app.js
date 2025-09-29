import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import compression from 'compression';

import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { env } from './config/env.js';
import { generalLimiter, authLimiter } from './middlewares/rateLimit.js';
import { notFound, errorHandler } from './middlewares/error.js';

import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import storeRoutes from './routes/store.routes.js';
import cartRoutes from './routes/cart.routes.js';
import reviewRoutes from './routes/review.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDoc = YAML.load(path.resolve(__dirname, './docs/openapi.yaml'));

const app = express();

app.set('trust proxy', true);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(compression());
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(
  pinoHttp({
    level: env.logLevel,
    redact: { paths: ['req.headers.authorization', 'res.headers["set-cookie"]'], remove: true },
  }),
);

app.use('/api', generalLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/readiness', (_req, res) => res.json({ ready: true }));

app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', storeRoutes);
app.use('/api', cartRoutes);
app.use('/api', reviewRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
