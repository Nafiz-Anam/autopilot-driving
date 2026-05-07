import express from 'express';
import paymentController from '../../controllers/payment.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.post('/', nextAuthBridge(), loadDrivingSchoolUser(), paymentController.createIntent);
router.post('/confirm', nextAuthBridge(), loadDrivingSchoolUser(), paymentController.confirm);

export default router;
