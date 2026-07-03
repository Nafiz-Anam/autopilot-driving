import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import progressiveRateLimitService from '../services/progressiveRateLimit.service';
import logger from '../config/logger';

interface RateLimitInfo {
  retryAfter?: number;
  resetTime: Date;
  penaltyLevel: number;
}

interface ProgressiveRateLimitOptions {
  type: 'auth' | 'password-reset' | 'registration' | 'api';
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response, info: RateLimitInfo) => void;
  onLimitReached?: (req: Request, res: Response, options: any) => void;
}

function buildRateLimitBody(message: string, info: RateLimitInfo) {
  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
  );
  return {
    code: httpStatus.TOO_MANY_REQUESTS,
    message,
    retryAfterSeconds,
    resetAt: info.resetTime.toISOString(),
    penaltyLevel: info.penaltyLevel,
  };
}

/**
 * Create a progressive rate limiting middleware
 */
const createProgressiveRateLimiter = (options: ProgressiveRateLimitOptions) => {
  const {
    type,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler,
    onLimitReached,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await progressiveRateLimitService.checkRateLimit(req, type);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': result.remaining.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
        'X-RateLimit-Penalty-Level': result.penaltyLevel.toString(),
        'X-RateLimit-Total-Requests': result.totalRequests.toString(),
      });

      if (!result.allowed) {
        // Rate limit exceeded
        logger.warn('Rate limit exceeded', {
          type,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          penaltyLevel: result.penaltyLevel,
          totalRequests: result.totalRequests,
          retryAfter: result.retryAfter,
        });

        const info: RateLimitInfo = {
          retryAfter: result.retryAfter,
          resetTime: result.resetTime,
          penaltyLevel: result.penaltyLevel,
        };

        if (handler) {
          return handler(req, res, info);
        }

        if (onLimitReached) {
          onLimitReached(req, res, result);
        }

        res
          .status(httpStatus.TOO_MANY_REQUESTS)
          .json(buildRateLimitBody('Too many requests, please try again later', info));

        return;
      }

      // Track request for skip logic
      const originalSend = res.send;
      res.send = function (body) {
        const statusCode = res.statusCode;

        // Determine if we should skip counting this request
        const shouldSkip =
          (skipSuccessfulRequests && statusCode < 400) || (skipFailedRequests && statusCode >= 400);

        if (!shouldSkip) {
          // Request is already counted in checkRateLimit, no need to update
        }

        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Progressive rate limiter error', { error, type });
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
};

/**
 * Predefined rate limiters for common use cases
 */
export const progressiveAuthLimiter = createProgressiveRateLimiter({
  type: 'auth',
  handler: (req, res, info) => {
    res
      .status(httpStatus.TOO_MANY_REQUESTS)
      .json(buildRateLimitBody('Too many authentication attempts, please try again later', info));
  },
  onLimitReached: (req, res, result) => {
    logger.warn('Authentication rate limit reached', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      penaltyLevel: result.penaltyLevel,
      endpoint: req.path,
    });
  },
});

export const progressivePasswordResetLimiter = createProgressiveRateLimiter({
  type: 'password-reset',
  handler: (req, res, info) => {
    res
      .status(httpStatus.TOO_MANY_REQUESTS)
      .json(buildRateLimitBody('Too many password reset attempts, please try again later', info));
  },
});

export const progressiveRegistrationLimiter = createProgressiveRateLimiter({
  type: 'registration',
  handler: (req, res, info) => {
    res
      .status(httpStatus.TOO_MANY_REQUESTS)
      .json(buildRateLimitBody('Too many registration attempts, please try again later', info));
  },
});

export const progressiveApiLimiter = createProgressiveRateLimiter({
  type: 'api',
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res, info) => {
    res
      .status(httpStatus.TOO_MANY_REQUESTS)
      .json(buildRateLimitBody('Too many requests, please try again later', info));
  },
});

/**
 * Middleware to reset rate limit for a user (admin function)
 */
export const resetRateLimit = (type: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await progressiveRateLimitService.resetRateLimit(req, type);
      res.json({ message: 'Rate limit reset successfully' });
    } catch (error) {
      logger.error('Failed to reset rate limit', { error, type });
      next(error);
    }
  };
};

/**
 * Middleware to get rate limit statistics (admin function)
 */
export const getRateLimitStats = (type: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await progressiveRateLimitService.getStats(type);
      res.json(stats);
    } catch (error) {
      logger.error('Failed to get rate limit stats', { error, type });
      next(error);
    }
  };
};

export default {
  createProgressiveRateLimiter,
  progressiveAuthLimiter,
  progressivePasswordResetLimiter,
  progressiveRegistrationLimiter,
  progressiveApiLimiter,
  resetRateLimit,
  getRateLimitStats,
};
