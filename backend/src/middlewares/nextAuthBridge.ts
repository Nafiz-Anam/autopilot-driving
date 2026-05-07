import httpStatus from 'http-status';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import ApiError from '../utils/ApiError';

declare global {
  namespace Express {
    interface Request {
      /** Next.js app `User.id` (student) from bridge JWT */
      appUserId?: string;
    }
  }
}

const BRIDGE_TYP = 'nextauth_bridge';

/**
 * Verifies a short-lived HS256 JWT minted by the Next.js `/api/auth/bridge-token` route.
 * Same secret as `NEXTAUTH_BRIDGE_SECRET` on frontend and backend.
 */
const nextAuthBridge =
  () => async (req: Request, res: Response, next: NextFunction) => {
    const secret = config.nextAuthBridge.secret;
    if (!secret) {
      return next(
        new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'App bridge authentication is not configured')
      );
    }

    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    try {
      const payload = jwt.verify(token, secret) as { sub?: string; typ?: string };
      if (payload.typ !== BRIDGE_TYP || !payload.sub) {
        throw new Error('invalid bridge token');
      }
      req.appUserId = payload.sub;
      return next();
    } catch {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
  };

export default nextAuthBridge;
