import express from 'express';
import studentAppController from '../../controllers/studentApp.controller';
import calendarController from '../../controllers/calendar.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser, requireDrivingRoles } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

/**
 * Mount this router at `/student` under `/v1`.
 * Example: `app.use('/v1/student', studentAppRoute)`.
 */
router.use(nextAuthBridge(), loadDrivingSchoolUser());

router.get('/profile', studentAppController.getProfile);
router.put('/profile', studentAppController.updateProfile);
router.post('/profile/password', studentAppController.changePassword);
router.get('/calendar-url', calendarController.getStudentCalendarUrl);

router.get('/stats', requireDrivingRoles('STUDENT'), studentAppController.getStats);
router.get(
  '/theory/questions',
  requireDrivingRoles('STUDENT'),
  studentAppController.getTheoryQuestions
);
router.get(
  '/theory/progress',
  requireDrivingRoles('STUDENT'),
  studentAppController.getTheoryProgress
);
router.post(
  '/theory/progress',
  requireDrivingRoles('STUDENT'),
  studentAppController.createTheoryProgress
);

export default router;
