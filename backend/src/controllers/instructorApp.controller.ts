import { Request, Response } from 'express';
import instructorAppService from '../services/instructorApp.service';

const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const profile = await instructorAppService.getInstructorProfileByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json({ data: profile });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instructor/profile GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const putProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const updated = await instructorAppService.updateInstructorProfileByUserId(userId, req.body ?? {});
    if (!updated) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json({ data: updated });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instructor/profile PUT]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getSchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const schedule = await instructorAppService.getInstructorScheduleByUserId(userId);
    if (!schedule) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json({ data: schedule });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instructor/schedule GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const postSchedule = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const { slots } = req.body ?? {};
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'slots must be an array' });
    }

    const saved = await instructorAppService.replaceInstructorScheduleByUserId(userId, slots);
    if (!saved) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json(saved);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instructor/schedule POST]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getStudents = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const students = await instructorAppService.getInstructorStudentsByUserId(userId);
    if (!students) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json({ data: students });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instructor/students GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const stats = await instructorAppService.getInstructorStatsByUserId(userId);
    if (!stats) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json(stats);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[instructor/stats GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  getProfile,
  putProfile,
  getSchedule,
  postSchedule,
  getStudents,
  getStats,
};
