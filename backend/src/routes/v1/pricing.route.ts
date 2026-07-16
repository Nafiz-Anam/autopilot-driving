import express from 'express';
import pricingController from '../../controllers/pricing.controller';

const router = express.Router();

router.get('/categories', pricingController.getCategories);
router.get('/packages', pricingController.getPackages);
router.get('/test-centres', pricingController.getTestCentres);
router.get('/theory-price', pricingController.getTheoryPrice);
router.get('/block-booking-banner', pricingController.getBlockBookingBanner);

export default router;
