import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import googleCalendarController from '../../controllers/googleCalendar.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

// Public — Google redirects here after OAuth consent (no auth needed)
router.get('/callback', googleCalendarController.callback);

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

router.get('/connect', bridgeFromQuery, nextAuthBridge(), loadDrivingSchoolUser(), googleCalendarController.connect);

// Standard authenticated routes
router.use(nextAuthBridge(), loadDrivingSchoolUser());
router.get('/status', googleCalendarController.status);
router.delete('/disconnect', googleCalendarController.disconnect);

export default router;
