import express from 'express';
import instructorAppController from '../../controllers/instructorApp.controller';
import calendarController from '../../controllers/calendar.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser, requireDrivingRoles } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.use(nextAuthBridge(), loadDrivingSchoolUser(), requireDrivingRoles('INSTRUCTOR'));

router.get('/profile', instructorAppController.getProfile);
router.put('/profile', instructorAppController.putProfile);

router.get('/schedule', instructorAppController.getSchedule);
router.post('/schedule', instructorAppController.postSchedule);

router.get('/students', instructorAppController.getStudents);
router.get('/stats', instructorAppController.getStats);
router.get('/calendar-url', calendarController.getCalendarUrl);

export default router;
