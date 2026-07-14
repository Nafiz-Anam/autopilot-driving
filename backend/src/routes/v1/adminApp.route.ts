import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import adminAppController from '../../controllers/adminApp.controller';
import blogController from '../../controllers/blog.controller';
import nextAuthBridge from '../../middlewares/nextAuthBridge';
import { loadDrivingSchoolUser, requireDrivingRoles } from '../../middlewares/drivingSchoolUser';

const blogImgDir = path.join(process.cwd(), 'uploads', 'blog');
const blogCoverDir = path.join(process.cwd(), 'uploads', 'blog-covers');
if (!fs.existsSync(blogImgDir)) fs.mkdirSync(blogImgDir, { recursive: true });
if (!fs.existsSync(blogCoverDir)) fs.mkdirSync(blogCoverDir, { recursive: true });

const blogImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, blogImgDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `blog-img-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid image type'));
  },
  limits: { fileSize: 8 * 1024 * 1024 },
});

const blogCoverUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, blogCoverDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `cover-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid image type'));
  },
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = express.Router();

router.use(nextAuthBridge(), loadDrivingSchoolUser(), requireDrivingRoles('ADMIN'));

router.get('/stats', adminAppController.getStats);

router.get('/bookings', adminAppController.getBookings);
router.patch('/bookings', adminAppController.patchBookings);
router.get('/bookings/:id', adminAppController.getBookingById);
router.patch('/bookings/:id', adminAppController.patchBookingById);
router.patch('/bookings/:id/reschedule', adminAppController.respondToBookingReschedule);

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

router.get('/pricing/test-centres', adminAppController.getTestCentres);
router.patch('/pricing/test-centres', adminAppController.patchTestCentres);

router.get('/pricing/theory-price', adminAppController.getTheoryAccessPrice);
router.patch('/pricing/theory-price', adminAppController.patchTheoryAccessPrice);

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

router.get('/blogs', blogController.adminListBlogs);
router.post('/blogs', blogController.adminCreateBlog);
router.post('/blogs/upload-image', blogImageUpload.single('file'), blogController.adminUploadImage);
router.post(
  '/blogs/upload-cover',
  blogCoverUpload.single('file'),
  blogController.adminUploadCoverImage
);
router.get('/blogs/:id', blogController.adminGetBlog);
router.put('/blogs/:id', blogController.adminUpdateBlog);
router.delete('/blogs/:id', blogController.adminDeleteBlog);
router.patch('/blogs/:id/publish', blogController.adminTogglePublish);

export default router;
