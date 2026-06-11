import express from 'express';
import bookingController from '../../controllers/booking.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.get('/availability', bookingController.getAvailability);
router.get('/', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.listMine);
router.post('/', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.createMine);
router.patch('/:id', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.cancelMine);
router.post('/:id/reschedule', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.postReschedule);
router.patch('/:id/reschedule', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.patchReschedule);

export default router;
