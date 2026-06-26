import express from 'express';
import pricingController from '../../controllers/pricing.controller';

const router = express.Router();

router.get('/categories', pricingController.getCategories);
router.get('/packages', pricingController.getPackages);
router.get('/test-centres', pricingController.getTestCentres);
router.get('/theory-price', pricingController.getTheoryPrice);

export default router;
