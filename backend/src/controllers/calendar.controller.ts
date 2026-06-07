import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../config/config';
import icalService from '../services/ical.service';
import prisma from '../client';

/** Derive a stable per-instructor token using HMAC — no DB column needed */
function instructorCalToken(instructorId: string): string {
  return crypto.createHmac('sha256', config.jwt.secret).update(instructorId).digest('hex');
}

/**
 * GET /v1/calendar/instructor/:instructorId.ics?token=<hmac>
 * Public endpoint — no session required. Calendar apps hit this directly.
 */
const getInstructorFeed = async (req: Request, res: Response): Promise<void> => {
  const { instructorId } = req.params as { instructorId: string };
  const { token } = req.query as { token?: string };

  const expected = instructorCalToken(instructorId);
  if (!token || token !== expected) {
    res.status(401).send('Invalid or missing calendar token');
    return;
  }

  const ics = await icalService.generateInstructorFeedIcs(instructorId);
  if (!ics) {
    res.status(404).send('Instructor not found');
    return;
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="my-lessons.ics"');
  res.send(ics);
};

/**
 * GET /v1/instructor/calendar-url  (authenticated — instructor only)
 * Returns the webcal:// subscription URL for the calling instructor.
 */
const getCalendarUrl = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  const instructor = rows[0];
  if (!instructor) {
    res.status(404).json({ error: 'Instructor profile not found' });
    return;
  }

  const token = instructorCalToken(instructor.id);
  const apiBase = config.clientUrl.replace(/\/$/, '');

  // webcal:// is identical to https:// but tells the OS to open a calendar app
  const feedUrl = `${apiBase.replace(/^https?/, 'webcal')}/api/calendar/instructor/${instructor.id}.ics?token=${token}`;
  const httpsUrl = `${apiBase}/api/calendar/instructor/${instructor.id}.ics?token=${token}`;

  res.json({ data: { webcalUrl: feedUrl, httpsUrl } });
};

export default { getInstructorFeed, getCalendarUrl };
