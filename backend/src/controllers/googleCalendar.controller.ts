import { Request, Response } from 'express';
import googleCalendarService from '../services/googleCalendar.service';
import config from '../config/config';

const FRONTEND_URL = config.clientUrl;

/** GET /v1/integrations/google-calendar/connect
 *  Accepts token via ?appToken= query param because this is a browser redirect, not an API call.
 */
const connect = (req: Request, res: Response): void => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) { res.redirect(`${FRONTEND_URL}/student/profile?cal=error`); return; }

  if (!config.google.calendar.clientId) {
    res.status(503).json({ error: 'Google Calendar integration is not configured' });
    return;
  }

  const url = googleCalendarService.getAuthUrl(userId);
  res.redirect(url);
};

/** GET /v1/integrations/google-calendar/callback */
const callback = async (req: Request, res: Response): Promise<void> => {
  const { code, state: userId, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  const redirectBase = `${FRONTEND_URL}/student/profile`;

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
  if (!userId) { res.status(401).json({ error: 'Unauthorised' }); return; }

  const connected = await googleCalendarService.isConnected(userId);
  const configured = Boolean(config.google.calendar.clientId);

  res.json({ data: { connected, configured } });
};

/** DELETE /v1/integrations/google-calendar/disconnect */
const disconnect = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) { res.status(401).json({ error: 'Unauthorised' }); return; }

  await googleCalendarService.disconnect(userId);
  res.json({ data: { connected: false } });
};

export default { connect, callback, status, disconnect };
