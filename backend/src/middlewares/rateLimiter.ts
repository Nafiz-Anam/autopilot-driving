import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config/config';

const ip = (req: Request) => ipKeyGenerator(req.ip ?? '127.0.0.1');
const ipUa = (req: Request) => `${ip(req)}-${req.get('User-Agent') ?? 'unknown'}`;

function handler(message: string, retryAfterSecs: number) {
  return (_req: Request, res: Response) => {
    res.status(429).json({ code: 429, message, retryAfter: retryAfterSecs });
  };
}

const prod = config.env === 'production';

// ── Auth login / app-login ────────────────────────────────────────────────────
// 20 attempts per 15 min — enough for normal use, still blocks brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: prod ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipUa,
  handler: handler('Too many login attempts — please try again in 15 minutes', 15 * 60),
  skip: (req) => req.path === '/health',
});

// ── Password reset ────────────────────────────────────────────────────────────
// 10 per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: prod ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipUa,
  handler: handler('Too many password reset attempts — please try again in 1 hour', 60 * 60),
});

// ── Registration ──────────────────────────────────────────────────────────────
// 30 per hour
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: prod ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipUa,
  handler: handler('Too many registration attempts — please try again in 1 hour', 60 * 60),
});

// ── Global API ────────────────────────────────────────────────────────────────
// 500 per 15 min — comfortable for normal browsing and admin use
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: prod ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ip,
  handler: handler('Too many requests — please slow down', 15 * 60),
  skip: (req) => req.path === '/health' || req.path.startsWith('/docs'),
});

// ── Payment endpoints ─────────────────────────────────────────────────────────
// 50 per hour — plenty for real users, still blocks card testing bots
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: prod ? 50 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ip,
  handler: handler('Too many payment requests — please try again later', 60 * 60),
});

// ── Booking / profile mutations ───────────────────────────────────────────────
// 100 per 10 min — enough for any normal user flow
export const sensitiveOperationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: prod ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ip,
  handler: handler('Too many requests for this operation — please slow down', 10 * 60),
});

// ── Push notifications ────────────────────────────────────────────────────────
// 30 per minute
export const pushNotificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: prod ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ip,
  handler: handler('Too many push notification requests', 60),
});
