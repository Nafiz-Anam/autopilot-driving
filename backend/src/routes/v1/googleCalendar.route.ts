import express, { Request, Response, NextFunction } from 'express';
import googleCalendarController from '../../controllers/googleCalendar.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

// Public — Google redirects here after OAuth consent (no auth needed)
router.get('/callback', googleCalendarController.callback);

// Public — Google push notification target (verified via X-Goog-Channel-Token = userId)
router.post('/webhook', express.json({ limit: '32kb' }), googleCalendarController.webhook);

/**
 * /connect is hit via browser redirect (not fetch), so the JWT must come
 * from the ?appToken= query param instead of the Authorization header.
 */
function bridgeFromQuery(req: Request, _res: Response, next: NextFunction) {
  const token = (req.query as { appToken?: string }).appToken;
  if (token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

router.get(
  '/connect',
  bridgeFromQuery,
  nextAuthBridge(),
  loadDrivingSchoolUser(),
  googleCalendarController.connect
);

router.use(nextAuthBridge(), loadDrivingSchoolUser());
router.get('/status', googleCalendarController.status);
router.delete('/disconnect', googleCalendarController.disconnect);
router.post('/resync', googleCalendarController.resync);

export default router;
