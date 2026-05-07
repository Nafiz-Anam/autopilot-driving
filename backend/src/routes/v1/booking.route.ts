import express from 'express';
import bookingController from '../../controllers/booking.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';

const router = express.Router();

router.get('/availability', bookingController.getAvailability);
router.get('/', nextAuthBridge(), bookingController.listMine);
router.post('/', nextAuthBridge(), bookingController.createMine);
router.patch('/:id', nextAuthBridge(), bookingController.cancelMine);

export default router;
