import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../config/config';
import icalService from '../services/ical.service';
import prisma from '../client';

function instructorCalToken(instructorId: string): string {
  return crypto
    .createHmac('sha256', config.jwt.secret)
    .update(`instructor:${instructorId}`)
    .digest('hex');
}

function studentCalToken(studentId: string): string {
  return crypto
    .createHmac('sha256', config.jwt.secret)
    .update(`student:${studentId}`)
    .digest('hex');
}

function buildBackendBase(): string {
  // The backend serves these ICS feeds directly — use the API base, not the frontend URL
  return (process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? config.clientUrl)
    .replace(/\/v1\/?$/, '')
    .replace(/\/$/, '');
}

/**
 * GET /v1/calendar/instructor/:instructorId.ics?token=<hmac>
 * Public — calendar apps subscribe to this directly.
 */
const getInstructorFeed = async (req: Request, res: Response): Promise<void> => {
  const { instructorId } = req.params as { instructorId: string };
  const { token } = req.query as { token?: string };

  if (!token || token !== instructorCalToken(instructorId)) {
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
 * GET /v1/calendar/student/:studentId.ics?token=<hmac>
 * Public — calendar apps subscribe to this directly.
 */
const getStudentFeed = async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params as { studentId: string };
  const { token } = req.query as { token?: string };

  if (!token || token !== studentCalToken(studentId)) {
    res.status(401).send('Invalid or missing calendar token');
    return;
  }

  const ics = await icalService.generateStudentFeedIcs(studentId);
  if (!ics) {
    res.status(404).send('Student not found');
    return;
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="my-driving-lessons.ics"');
  res.send(ics);
};

/**
 * GET /v1/instructor/calendar-url  (authenticated — instructor only)
 */
const getInstructorCalendarUrl = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Instructor" WHERE "userId" = $1 LIMIT 1`,
    userId
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'Instructor profile not found' });
    return;
  }

  const token = instructorCalToken(rows[0].id);
  const base = buildBackendBase();
  const path = `/v1/calendar/instructor/${rows[0].id}.ics?token=${token}`;

  res.json({
    data: {
      webcalUrl: `${base.replace(/^https?/, 'webcal')}${path}`,
      httpsUrl: `${base}${path}`,
    },
  });
};

/**
 * GET /v1/student/calendar-url  (authenticated — student only)
 */
const getStudentCalendarUrl = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  const token = studentCalToken(userId);
  const base = buildBackendBase();
  const path = `/v1/calendar/student/${userId}.ics?token=${token}`;

  res.json({
    data: {
      webcalUrl: `${base.replace(/^https?/, 'webcal')}${path}`,
      httpsUrl: `${base}${path}`,
    },
  });
};

export default {
  getInstructorFeed,
  getStudentFeed,
  getInstructorCalendarUrl,
  getStudentCalendarUrl,
  // legacy alias used in instructorApp.route
  getCalendarUrl: getInstructorCalendarUrl,
};
