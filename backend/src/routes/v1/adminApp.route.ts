import express from 'express';
import adminAppController from '../../controllers/adminApp.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser, requireDrivingRoles } from '../../middlewares/drivingSchoolUser';

const router = express.Router();

router.use(nextAuthBridge(), loadDrivingSchoolUser(), requireDrivingRoles('ADMIN'));

router.get('/stats', adminAppController.getStats);

router.get('/bookings', adminAppController.getBookings);
router.patch('/bookings', adminAppController.patchBookings);
router.get('/bookings/:id', adminAppController.getBookingById);
router.patch('/bookings/:id', adminAppController.patchBookingById);

router.get('/users', adminAppController.getUsers);
router.post('/users', adminAppController.postUsers);
router.patch('/users', adminAppController.patchUsers);
router.get('/users/:id', adminAppController.getUserById);
router.patch('/users/:id', adminAppController.patchUserById);
router.delete('/users/:id', adminAppController.deleteUserById);

router.get('/applications', adminAppController.getApplications);
router.patch('/applications', adminAppController.patchApplications);
router.get('/applications/:id', adminAppController.getApplicationById);
router.patch('/applications/:id', adminAppController.patchApplicationById);

router.get('/areas', adminAppController.getAreas);
router.post('/areas', adminAppController.postAreas);
router.put('/areas/:id', adminAppController.patchAreaById);
router.patch('/areas/:id', adminAppController.patchAreaById);
router.delete('/areas/:id', adminAppController.deleteAreaById);

router.get('/contact', adminAppController.getContact);
router.delete('/contact/:id', adminAppController.deleteContactById);

router.get('/coupons', adminAppController.getCoupons);
router.post('/coupons', adminAppController.postCoupons);
router.patch('/coupons/:id', adminAppController.patchCouponById);

router.get('/instructors', adminAppController.getInstructors);
router.post('/instructors', adminAppController.postInstructors);
router.patch('/instructors', adminAppController.patchInstructors);
router.get('/instructors/:id', adminAppController.getInstructorById);
router.patch('/instructors/:id', adminAppController.patchInstructorById);
router.delete('/instructors/:id', adminAppController.deleteInstructorById);
router.get('/instructors/:id/schedule', adminAppController.getInstructorSchedule);
router.post('/instructors/:id/schedule', adminAppController.postInstructorSchedule);

router.get('/pricing/categories', adminAppController.getPricingCategories);
router.patch('/pricing/categories/:id', adminAppController.patchPricingCategoryById);

router.post('/pricing/packages', adminAppController.postPricingPackages);
router.patch('/pricing/packages/:id', adminAppController.patchPricingPackageById);
router.delete('/pricing/packages/:id', adminAppController.deletePricingPackageById);

router.get('/settings', adminAppController.getSettings);
router.patch('/settings', adminAppController.patchSettings);
router.post('/settings', adminAppController.postSettings);
router.get('/settings/stripe', adminAppController.getStripeSettings);
router.patch('/settings/stripe', adminAppController.patchStripeSettings);
router.post('/settings/stripe/test', adminAppController.postStripeSettings);
router.get('/settings/smtp', adminAppController.getSmtpSettings);
router.patch('/settings/smtp', adminAppController.patchSmtpSettings);
router.post('/settings/smtp/test', adminAppController.postSmtpSettings);

router.get('/theory', adminAppController.getTheory);
router.post('/theory', adminAppController.postTheory);
router.get('/theory/:id', adminAppController.getTheoryById);
router.put('/theory/:id', adminAppController.putTheoryById);
router.delete('/theory/:id', adminAppController.deleteTheoryById);

export default router;
