import httpStatus from 'http-status';
import { NextFunction, Request, Response } from 'express';
import prisma from '../client';
import ApiError from '../utils/ApiError';

export type DrivingSchoolRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';

declare global {
  namespace Express {
    interface Request {
      drivingUser?: {
        id: string;
        role: DrivingSchoolRole;
        name: string | null;
        email: string;
      };
    }
  }
}

/** After `nextAuthBridge`, loads the driving-school `User` row from Postgres. */
const loadDrivingSchoolUser =
  () => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.appUserId;
      if (!id) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }
      const rows = await prisma.$queryRawUnsafe<
        Array<{ id: string; role: string; name: string | null; email: string }>
      >(`SELECT id, role::text AS role, name, email FROM "User" WHERE id = $1 LIMIT 1`, id);
      const u = rows[0];
      if (!u) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
      }
      req.drivingUser = {
        id: u.id,
        role: u.role as DrivingSchoolRole,
        name: u.name,
        email: u.email,
      };
      return next();
    } catch (e) {
      return next(e);
    }
  };

const requireDrivingRoles =
  (...roles: DrivingSchoolRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.drivingUser) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    if (!roles.includes(req.drivingUser.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
    return next();
  };

export { loadDrivingSchoolUser, requireDrivingRoles };
