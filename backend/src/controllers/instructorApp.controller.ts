import { Request, Response } from 'express';
import instructorAppService from '../services/instructorApp.service';
import rescheduleService from '../services/reschedule.service';
import studentAppService from '../services/studentApp.service';

const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const profile = await instructorAppService.getInstructorProfileByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Instructor profile not found' });

    return res.json({ data: profile });
  } catch (err) {
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
    console.error('[instructor/stats GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const page = Number(req.query.page) || 1;
    const status = req.query.status as string | undefined;

    const result = await instructorAppService.listMyBookings(userId, { status, page });
    return res.json(result);
  } catch (err) {
    console.error('[instructor/bookings GET]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelMyBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const bookingId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const reason: string | undefined = req.body?.reason;
    const notes: string | undefined = req.body?.notes;

    if (!reason) return res.status(400).json({ error: 'reason is required' });

    const result = await instructorAppService.cancelMyBooking(bookingId, userId, reason, notes);

    if ('error' in result) {
      const errCode: Record<string, number> = { NOT_FOUND: 404, FORBIDDEN: 403, BAD_STATE: 400 };
      const code = errCode[result.error] ?? 400;
      return res.status(code).json({ error: result.error });
    }

    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('[instructor/bookings/:id/cancel PATCH]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const postReschedule = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const bookingId = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
    const proposedDateTime: string | undefined = req.body?.proposedDateTime;
    const reason: string | undefined = req.body?.reason;
    const notes: string | undefined = req.body?.notes;

    if (!proposedDateTime || !reason) {
      return res.status(400).json({ error: 'proposedDateTime and reason are required' });
    }

    const result = await rescheduleService.createRequest({
      bookingId,
      requestedByUserId: userId,
      requestedByRole: 'INSTRUCTOR',
      proposedDateTime,
      reason,
      notes,
    });

    if ('error' in result) {
      const code = result.error === 'NOT_FOUND' ? 404 : 400;
      return res.status(code).json({ error: result.error });
    }

    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('[instructor/bookings/:id/reschedule POST]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const patchReschedule = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });

    const requestId: string | undefined = req.body?.requestId;
    const accept: boolean | undefined = req.body?.accept;

    if (!requestId || accept === undefined) {
      return res.status(400).json({ error: 'requestId and accept are required' });
    }

    const result = await rescheduleService.respondToRequest({
      requestId,
      respondedByUserId: userId as string,
      respondedByRole: 'INSTRUCTOR',
      accept: Boolean(accept),
    });

    if ('error' in result) {
      const errCode: Record<string, number> = { NOT_FOUND: 404, FORBIDDEN: 403, BAD_STATE: 400 };
      const code = errCode[result.error] ?? 400;
      return res.status(code).json({ error: result.error });
    }

    return res.json({ success: true, data: result.data });
  } catch (err) {
    console.error('[instructor/bookings/:id/reschedule PATCH]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.drivingUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorised' });
    const { current, newPassword } = req.body ?? {};
    if (!current || !newPassword) return res.status(400).json({ error: 'current and newPassword required' });
    const result = await studentAppService.changePassword(userId, current, newPassword);
    if ('error' in result) return res.status(400).json({ error: result.error });
    return res.json({ success: true });
  } catch (err) {
    console.error('[instructor/profile/password POST]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  getProfile,
  putProfile,
  changePassword,
  getSchedule,
  postSchedule,
  getStudents,
  getStats,
  getMyBookings,
  cancelMyBooking,
  postReschedule,
  patchReschedule,
};
