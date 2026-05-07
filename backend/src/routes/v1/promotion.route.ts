import express from 'express';
import promotionController from '../../controllers/promotion.controller';

const router = express.Router();

router.post('/validate', promotionController.validate);

export default router;
