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

/** After `nextAuthBridge`, loads the app user row from Prisma. */
const loadDrivingSchoolUser = () => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.appUserId;
    if (!id) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    const u = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true, email: true },
    });
    if (!u) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User not found'));
    }

    let drivingRole: DrivingSchoolRole = 'STUDENT';
    if (u.role === 'ADMIN') {
      drivingRole = 'ADMIN';
    } else {
      const instructorProfile = await prisma.instructor.findUnique({
        where: { userId: id },
        select: { id: true },
      });
      if (instructorProfile) drivingRole = 'INSTRUCTOR';
    }

    req.drivingUser = {
      id: u.id,
      role: drivingRole,
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
