import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import studentAppService from '../services/studentApp.service';

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.appUserId!;
  const user = await studentAppService.getProfile(userId);

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'User not found' });
  }

  return res.status(httpStatus.OK).send({ data: user });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.appUserId!;
  const { name, phone } = req.body as { name?: string; phone?: string | null };

  const user = await studentAppService.updateProfile(userId, { name, phone });
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'User not found' });
  }

  return res.status(httpStatus.OK).send({ data: user });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.appUserId!;
  const { current, newPassword } = req.body as { current?: string; newPassword?: string };

  if (!current || !newPassword) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Missing fields' });
  }
  if (newPassword.length < 8) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ error: 'Password must be at least 8 characters' });
  }

  const result = await studentAppService.changePassword(userId, current, newPassword);
  if ('error' in result) {
    if (result.error === 'NO_PASSWORD') {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ error: 'No password set on this account (OAuth login)' });
    }
    if (result.error === 'INVALID_CURRENT') {
      return res.status(httpStatus.BAD_REQUEST).send({ error: 'Current password is incorrect' });
    }
  }

  return res.status(httpStatus.OK).send({ success: true });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const stats = await studentAppService.getStats(studentId);
  return res.status(httpStatus.OK).send(stats);
});

const getTheoryProgress = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const categories = await studentAppService.getTheoryProgress(studentId);
  return res.status(httpStatus.OK).send({ data: categories });
});

const createTheoryProgress = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.appUserId!;
  const { questionId, isCorrect } = req.body as { questionId?: string; isCorrect?: boolean };

  await studentAppService.createTheoryProgress(studentId, questionId, isCorrect);
  return res.status(httpStatus.OK).send({ success: true });
});

const getTheoryQuestions = catchAsync(async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const questions = await studentAppService.getTheoryQuestions(limit);
  return res.status(httpStatus.OK).send({ data: questions });
});

export default {
  getProfile,
  updateProfile,
  changePassword,
  getStats,
  getTheoryProgress,
  createTheoryProgress,
  getTheoryQuestions,
};
