import express from 'express';
import publicSiteController from '../../controllers/publicSite.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';

const router = express.Router();

router.get('/areas', publicSiteController.getAreas);
router.get('/instructors', publicSiteController.getInstructors);
router.get('/pricing/categories', publicSiteController.getPricingCategories);
router.get('/pricing/test-centres', publicSiteController.getTestCentres);
router.post('/instructors/apply', publicSiteController.applyInstructor);
router.post('/contact', publicSiteController.submitContact);
router.post('/register', publicSiteController.register);
router.get('/theory/questions', nextAuthBridge(), publicSiteController.getTheoryQuestions);
router.get('/reviews', publicSiteController.getGoogleReviews);

export default router;
