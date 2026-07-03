import express from 'express';
import appleCalendarController from '../../controllers/appleCalendar.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.use(nextAuthBridge(), loadDrivingSchoolUser());

router.get('/status', appleCalendarController.status);
router.post('/connect', appleCalendarController.connect);
router.delete('/disconnect', appleCalendarController.disconnect);
router.post('/resync', appleCalendarController.resync);

export default router;
