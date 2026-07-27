import express from 'express';
import instructorAppController from '../../controllers/instructorApp.controller';
import calendarController from '../../controllers/calendar.controller';
import progressReportController from '../../controllers/progressReport.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser, requireDrivingRoles } from '../../middlewares/drivingSchoolUser';
import validate from '../../middlewares/validate';
import progressReportValidation from '../../validations/progressReport.validation';

const router = express.Router();

router.use(nextAuthBridge(), loadDrivingSchoolUser(), requireDrivingRoles('INSTRUCTOR'));

router.get('/profile', instructorAppController.getProfile);
router.put('/profile', instructorAppController.putProfile);
router.post('/profile/password', instructorAppController.changePassword);

router.get('/schedule/overview', instructorAppController.getScheduleOverview);

router.get('/students', instructorAppController.getStudents);
router.get('/stats', instructorAppController.getStats);
router.get('/calendar-url', calendarController.getCalendarUrl);

router.get('/bookings', instructorAppController.getMyBookings);
router.patch('/bookings/:id/cancel', instructorAppController.cancelMyBooking);
router.patch('/bookings/:id/complete', instructorAppController.markBookingComplete);
router.post('/bookings/:id/reschedule', instructorAppController.postReschedule);
router.patch('/bookings/:id/reschedule', instructorAppController.patchReschedule);

router.get('/skills', progressReportController.listSkills);
router.get(
  '/bookings/:id/progress-report',
  validate(progressReportValidation.getReport),
  progressReportController.getInstructorReport
);
router.put(
  '/bookings/:id/progress-report',
  validate(progressReportValidation.upsertReport),
  progressReportController.upsertInstructorReport
);
router.patch(
  '/bookings/:id/progress-report/publish',
  validate(progressReportValidation.publishReport),
  progressReportController.publishReport
);
router.patch(
  '/bookings/:id/progress-report/unpublish',
  validate(progressReportValidation.unpublishReport),
  progressReportController.unpublishReport
);

export default router;
