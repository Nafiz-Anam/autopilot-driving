import express from 'express';
import instructorAppController from '../../controllers/instructorApp.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser, requireDrivingRoles } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.use(nextAuthBridge(), loadDrivingSchoolUser(), requireDrivingRoles('INSTRUCTOR'));

router.get('/profile', instructorAppController.getProfile);
router.put('/profile', instructorAppController.putProfile);
router.post('/profile/password', instructorAppController.changePassword);

router.get('/schedule', instructorAppController.getSchedule);
router.post('/schedule', instructorAppController.postSchedule);

router.get('/students', instructorAppController.getStudents);
router.get('/stats', instructorAppController.getStats);

router.get('/bookings', instructorAppController.getMyBookings);
router.patch('/bookings/:id/cancel', instructorAppController.cancelMyBooking);
router.post('/bookings/:id/reschedule', instructorAppController.postReschedule);
router.patch('/bookings/:id/reschedule', instructorAppController.patchReschedule);

export default router;
