import express from 'express';
import bookingController from '../../controllers/booking.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.get('/availability', bookingController.getAvailability);
router.get('/', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.listMine);
router.post('/', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.createMine);
router.patch('/:id', nextAuthBridge(), loadDrivingSchoolUser(), bookingController.cancelMine);

export default router;
