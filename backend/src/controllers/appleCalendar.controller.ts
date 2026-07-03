import { Request, Response } from 'express';
import appleCalendarService from '../services/appleCalendar.service';

const connect = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) { res.status(401).json({ error: 'Unauthorised' }); return; }

  const url = String(req.body?.url ?? '').trim();
  const label = req.body?.label ? String(req.body.label).trim() : undefined;
  if (!url) { res.status(400).json({ error: 'url is required' }); return; }

  const result = await appleCalendarService.connect(userId, url, label);
  if (result.ok === false) {
    res.status(400).json({ error: result.reason });
    return;
  }
  res.json({ data: { connected: true } });
};

const disconnect = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) { res.status(401).json({ error: 'Unauthorised' }); return; }
  await appleCalendarService.disconnect(userId);
  res.json({ data: { connected: false } });
};

const status = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) { res.status(401).json({ error: 'Unauthorised' }); return; }
  const data = await appleCalendarService.getIntegrationStatus(userId);
  res.json({ data });
};

const resync = async (req: Request, res: Response): Promise<void> => {
  const userId = req.drivingUser?.id ?? (req.appUserId as string | undefined);
  if (!userId) { res.status(401).json({ error: 'Unauthorised' }); return; }
  appleCalendarService.syncOne(userId).catch(err => {
    console.error('[appleCalendar] manual resync failed', err?.message);
  });
  res.json({ data: { queued: true } });
};

export default { connect, disconnect, status, resync };
