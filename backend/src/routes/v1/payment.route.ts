import express from 'express';
import paymentController from '../../controllers/payment.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';

const router = express.Router();

router.post('/', nextAuthBridge(), paymentController.createIntent);
router.post('/confirm', nextAuthBridge(), paymentController.confirm);

export default router;
