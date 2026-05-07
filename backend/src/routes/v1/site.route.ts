import express from 'express';
import siteController from '../../controllers/site.controller';

const router = express.Router();

router.get('/stripe/config', siteController.stripePublishableKey);

export default router;
