import { Request, Response } from 'express';
import googleCalendarService from '../services/googleCalendar.service';
import googleCalendarSyncService from '../services/googleCalendarSync.service';
import config from '../config/config';
import prisma from '../client';

const FRONTEND_URL = config.clientUrl;

async function resolveRedirectBase(userId: string): Promise<string> {
  const inst = await prisma.instructor.findFirst({ where: { userId }, select: { id: true } });
  return inst ? `${FRONTEND_URL}/instructor/profile` : `${FRONTEND_URL}/student/profile`;
}

/** GET /v1/integrations/google-calendar/connect */
const connect = (req: Request, res: Response): void => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) {
    res.redirect(`${FRONTEND_URL}/login?cal=error`);
    return;
  }
  if (!config.google.calendar.clientId) {
    res.status(503).json({ error: 'Google Calendar integration is not configured' });
    return;
  }
  const url = googleCalendarService.getAuthUrl(userId);
  res.redirect(url);
};

/** GET /v1/integrations/google-calendar/callback */
const callback = async (req: Request, res: Response): Promise<void> => {
  const {
    code,
    state: userId,
    error,
  } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  const redirectBase = userId ? await resolveRedirectBase(userId) : `${FRONTEND_URL}/login`;

  if (error || !code || !userId) {
    res.redirect(`${redirectBase}?cal=error`);
    return;
  }

  try {
    await googleCalendarService.handleOAuthCallback(code, userId);
    res.redirect(`${redirectBase}?cal=connected`);
  } catch (err) {
    console.error('[GoogleCalendar] callback error', err);
    res.redirect(`${redirectBase}?cal=error`);
  }
};

/** GET /v1/integrations/google-calendar/status */
const status = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  const data = await googleCalendarService.getIntegrationStatus(userId);
  res.json({ data });
};

/** DELETE /v1/integrations/google-calendar/disconnect */
const disconnect = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  await googleCalendarService.disconnect(userId);
  res.json({ data: { connected: false } });
};

/** POST /v1/integrations/google-calendar/resync */
const resync = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }
  googleCalendarSyncService.startWatchAndInitialSync(userId).catch(err => {
    console.error('[GoogleCalendar] manual resync failed', err?.message);
  });
  res.json({ data: { queued: true } });
};

/**
 * POST /v1/integrations/google-calendar/webhook
 * Public — Google push channel target. Verify via X-Goog-Channel-Token = userId.
 */
const webhook = async (req: Request, res: Response): Promise<void> => {
  const channelId = req.header('X-Goog-Channel-Id') ?? '';
  const channelToken = req.header('X-Goog-Channel-Token') ?? '';
  const resourceState = req.header('X-Goog-Resource-State') ?? '';

  res.status(200).end();

  if (!channelId) return;
  googleCalendarSyncService.handleWebhook(channelId, channelToken, resourceState).catch(err => {
    console.error('[GoogleCalendar] webhook handler failed', err?.message);
  });
};

export default { connect, callback, status, disconnect, resync, webhook };
