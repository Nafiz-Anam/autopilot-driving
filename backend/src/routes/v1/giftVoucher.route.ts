import express from 'express';
import giftVoucherPurchaseController from '../../controllers/giftVoucherPurchase.controller';

const router = express.Router();

router.post('/', giftVoucherPurchaseController.createIntent);
router.post('/confirm', giftVoucherPurchaseController.confirm);

export default router;
