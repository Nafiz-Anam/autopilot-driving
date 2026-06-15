import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import passport from 'passport';
import httpStatus from 'http-status';
import config from './config/config';
import logger from './config/logger';
import morgan from './config/morgan';
import xss from './middlewares/xss';
import { jwtStrategy } from './config/passport';
import {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  sensitiveOperationLimiter,
  paymentLimiter,
} from './middlewares/rateLimiter';
import { securityHeaders } from './middlewares/security';
import { performanceTracker, addPerformanceHeaders } from './middlewares/performanceMonitoring';
import { addRequestId } from './middlewares/requestId';
import { sanitizeInput } from './middlewares/sanitize';
import routes from './routes/v1';
import { healthController } from './controllers';
import { errorConverter, errorHandler } from './utils/errorHandler';
import ApiError from './utils/ApiError';
import { requestLogger } from './utils/structuredLogger';
import paymentWebhookController from './controllers/paymentWebhook.controller';
import instructorAppRoute from './routes/v1/instructorApp.route';

const app = express();

// ── Logging ──────────────────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(securityHeaders);

// ── CORS ──────────────────────────────────────────────────────────────────────
// Build whitelist from ALLOWED_ORIGINS, falling back to NEXT_PUBLIC_APP_URL
// then CLIENT_URL so it works in production without manual env var setup.
const _rawOrigins = [
  process.env.ALLOWED_ORIGINS,
  process.env.NEXT_PUBLIC_APP_URL,
  config.clientUrl,
]
  .filter(Boolean)
  .join(',');

const allowedOrigins = _rawOrigins
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // No origin = server-to-server call — always allow
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Log and reject — use null, false (not an Error) to avoid 500s
    logger.warn(`CORS blocked: ${origin}`);
    cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
// Pre-flight for all routes (Express 5 requires named wildcard)
app.options('/{*path}', cors(corsOptions));

// ── Stripe webhooks — raw body BEFORE express.json() ─────────────────────────
app.post(
  '/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentWebhookController.handleStripe
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request infrastructure ────────────────────────────────────────────────────
app.use(addRequestId);
app.use(requestLogger);
app.use(sanitizeInput);
app.use(xss());
app.use(compression());

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// ── Performance ───────────────────────────────────────────────────────────────
app.use(performanceTracker);
app.use(addPerformanceHeaders);

// ── Health checks (no rate limiting) ─────────────────────────────────────────
app.get('/v1/health', healthController.healthCheck);
app.get('/v1/health/database', healthController.databaseHealthCheck);
app.get('/v1/health/email', healthController.emailHealthCheck);
app.get('/v1/health/cache', healthController.cacheHealthCheck);
app.get('/v1/health/detailed', healthController.detailedHealthCheck);
app.get('/v1/health/ready', healthController.readinessCheck);
app.get('/v1/health/live', healthController.livenessCheck);

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Global — all /v1 endpoints
app.use('/v1', apiLimiter);

// Auth — strict limits on all envs
app.use('/v1/auth/login', authLimiter);
app.use('/v1/auth/app-login', authLimiter);
app.use('/v1/auth/register', registrationLimiter);
app.use('/v1/auth/forgot-password', passwordResetLimiter);
app.use('/v1/auth/reset-password', passwordResetLimiter);

// Payment — dedicated limits (prevents payment abuse / enumeration)
app.use('/v1/payments', paymentLimiter);
app.use('/v1/gift-vouchers', paymentLimiter);

// Booking mutations — sensitive operation limit
app.use('/v1/bookings', sensitiveOperationLimiter);

// Student / instructor profile mutations
app.use('/v1/student/profile', sensitiveOperationLimiter);
app.use('/v1/instructor/profile', sensitiveOperationLimiter);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/v1/instructor', instructorAppRoute);
app.use('/v1', routes);

// ── Root info ─────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'AutoPilot Driving School API',
    version: '1.0.0',
    environment: config.env,
  });
});

// ── 404 + error handlers ──────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});
app.use(errorConverter);
app.use(errorHandler);

export default app;
