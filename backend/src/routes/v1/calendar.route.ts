import express from 'express';
import calendarController from '../../controllers/calendar.controller';

const router = express.Router();

// Public — validated by HMAC token in query string
router.get('/instructor/:instructorId.ics', calendarController.getInstructorFeed);

export default router;
