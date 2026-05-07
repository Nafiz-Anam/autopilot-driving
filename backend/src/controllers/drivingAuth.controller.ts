import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { sendSuccess } from '../utils/apiResponse';
import drivingAuthService from '../services/drivingAuth.service';

const appLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await drivingAuthService.loginWithEmailPassword(email, password);
  return sendSuccess(res, result, 'Login successful', httpStatus.OK, req.requestId);
});

const appSession = catchAsync(async (req: Request, res: Response) => {
  const u = req.drivingUser!;
  return sendSuccess(
    res,
    {
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
      },
    },
    undefined,
    httpStatus.OK,
    req.requestId
  );
});

export default {
  appLogin,
  appSession,
};
