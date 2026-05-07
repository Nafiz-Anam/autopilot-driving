import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import adminAppService from '../services/adminApp.service';

/** Express 5 `req.params.id` can be `string | string[]`. */
const pid = (req: Request) => {
  const raw = req.params.id;
  return typeof raw === 'string' ? raw : raw?.[0] ?? '';
};

const getStats = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminAppService.getStats();
  res.status(httpStatus.OK).send(data);
});

const getBookings = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.listBookings({
    status: String(req.query.status ?? ''),
    page: Number(req.query.page ?? 1),
  });
  res.status(httpStatus.OK).send(data);
});

const patchBookings = catchAsync(async (req: Request, res: Response) => {
  const { id, status } = req.body as { id?: string; status?: string };
  if (!id || !status) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'id and status are required' });
  }
  if (!adminAppService.VALID_BOOKING_STATUSES.includes(status as any)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid status' });
  }
  const data = await adminAppService.updateBookingStatus(id, status);
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Booking not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.getBookingById(pid(req));
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Booking not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const patchBookingById = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as { status?: string; paymentStatus?: string; notes?: string | null };
  const payload: { status?: string; paymentStatus?: string; notes?: string | null } = {};

  if (body.status && adminAppService.VALID_BOOKING_STATUSES.includes(body.status as any)) {
    payload.status = body.status;
  }
  if (
    body.paymentStatus &&
    adminAppService.VALID_PAYMENT_STATUSES.includes(body.paymentStatus as any)
  ) {
    payload.paymentStatus = body.paymentStatus;
  }
  if (body.notes !== undefined) payload.notes = body.notes;

  const data = await adminAppService.patchBookingById(pid(req), payload);
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Booking not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.listUsers({
    search: String(req.query.search ?? ''),
    role: String(req.query.role ?? ''),
    page: Number(req.query.page ?? 1),
  });
  res.status(httpStatus.OK).send(data);
});

const patchUsers = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.body as { id?: string; role?: string };
  if (!id || !role) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'id and role are required' });
  }
  if (!adminAppService.VALID_USER_ROLES.includes(role as any)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid role' });
  }
  const data = await adminAppService.updateUserRole(id, role);
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'User not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.getUserById(pid(req));
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'User not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const deleteUserById = catchAsync(async (req: Request, res: Response) => {
  if (pid(req) === req.drivingUser?.id) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Cannot delete your own account' });
  }
  await adminAppService.deleteUserById(pid(req));
  return res.status(httpStatus.OK).send({ success: true });
});

const getApplications = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.listApplications({
    status: String(req.query.status ?? ''),
    page: Number(req.query.page ?? 1),
  });
  res.status(httpStatus.OK).send(data);
});

const patchApplications = catchAsync(async (req: Request, res: Response) => {
  const { id, status } = req.body as { id?: string; status?: string };
  if (!id || !status) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'id and status are required' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid status' });
  }
  const data = await adminAppService.updateApplicationStatus(id, status);
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Application not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getApplicationById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.getApplicationById(pid(req));
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Application not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const patchApplicationById = catchAsync(async (req: Request, res: Response) => {
  const status = String(req.body?.status ?? '');
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid status' });
  }
  const data = await adminAppService.updateApplicationStatus(pid(req), status);
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Application not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getAreas = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminAppService.listAreas();
  res.status(httpStatus.OK).send({ data });
});

const postAreas = catchAsync(async (req: Request, res: Response) => {
  const { name, postcodePrefix, description, isActive } = req.body as {
    name?: string;
    postcodePrefix?: string;
    description?: string;
    isActive?: boolean;
  };
  if (!name || !postcodePrefix) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'name and postcodePrefix are required' });
  }
  const data = await adminAppService.createArea({ name, postcodePrefix, description, isActive });
  return res.status(httpStatus.CREATED).send({ data });
});

const patchAreaById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.updateAreaById(pid(req), req.body ?? {});
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Area not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const deleteAreaById = catchAsync(async (req: Request, res: Response) => {
  await adminAppService.deleteAreaById(pid(req));
  return res.status(httpStatus.OK).send({ success: true });
});

const getContact = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.listContacts({ page: Number(req.query.page ?? 1) });
  res.status(httpStatus.OK).send(data);
});

const deleteContactById = catchAsync(async (req: Request, res: Response) => {
  await adminAppService.deleteContactById(pid(req));
  return res.status(httpStatus.OK).send({ success: true });
});

const getCoupons = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminAppService.listCoupons();
  res.status(httpStatus.OK).send({ data });
});

const postCoupons = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as any;
  if (!body?.code || !adminAppService.VALID_COUPON_TYPES.includes(body.type)) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid input' });
  }
  if (!Number.isFinite(Number(body.value)) || Number(body.value) <= 0) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid input' });
  }
  const data = await adminAppService.createCoupon({
    code: String(body.code),
    name: body.name ?? null,
    type: body.type,
    value: Number(body.value),
    maxDiscountAmount: body.maxDiscountAmount ?? null,
    minOrderAmount: body.minOrderAmount ?? null,
    startsAt: body.startsAt ?? null,
    endsAt: body.endsAt ?? null,
    maxRedemptions: body.maxRedemptions ?? null,
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
  });
  return res.status(httpStatus.CREATED).send({ data });
});

const patchCouponById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.patchCouponById(pid(req), req.body ?? {});
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getInstructors = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.listInstructors({
    search: String(req.query.search ?? ''),
    isActive: req.query.isActive == null ? null : String(req.query.isActive),
  });
  return res.status(httpStatus.OK).send({ data });
});

const patchInstructors = catchAsync(async (req: Request, res: Response) => {
  const { id, ...rest } = req.body as any;
  if (!id) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'id is required' });
  }
  const data = await adminAppService.patchInstructorById(id, rest);
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Instructor not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getInstructorById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.getInstructorById(pid(req));
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Instructor not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const patchInstructorById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.patchInstructorById(pid(req), req.body ?? {});
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Instructor not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const getPricingCategories = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminAppService.listPricingCategories();
  return res.status(httpStatus.OK).send({ data });
});

const patchPricingCategoryById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.patchPricingCategory(pid(req), req.body ?? {});
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const postPricingPackages = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as any;
  if (!body?.categoryId || !body?.slug || !body?.name) {
    return res.status(httpStatus.BAD_REQUEST).send({ error: 'Invalid input' });
  }
  const data = await adminAppService.createPricingPackage({
    categoryId: String(body.categoryId),
    slug: String(body.slug),
    name: String(body.name),
    hours: Number(body.hours),
    lessons: Number(body.lessons),
    price: Number(body.price),
    pricePerHour: body.pricePerHour ?? null,
    savings: body.savings ?? null,
    footerNote: body.footerNote ?? null,
    badge: body.badge ?? null,
    isPopular: body.isPopular ?? false,
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive ?? true,
  });
  return res.status(httpStatus.CREATED).send({ data });
});

const patchPricingPackageById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.patchPricingPackage(pid(req), req.body ?? {});
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const deletePricingPackageById = catchAsync(async (req: Request, res: Response) => {
  await adminAppService.deactivatePricingPackage(pid(req));
  return res.status(httpStatus.OK).send({ ok: true });
});

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const data = await adminAppService.getSettings();
  return res.status(httpStatus.OK).send({ success: true, data });
});

const patchSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await adminAppService.patchSettings(req.body ?? {});
  if ('error' in result) {
    return res.status(httpStatus.BAD_REQUEST).send({ success: false, error: result.error });
  }
  return res.status(httpStatus.OK).send({ success: true });
});

const postSettings = catchAsync(async (req: Request, res: Response) => {
  const action = String(req.body?.action ?? '');
  const result = await adminAppService.testSettings(action);
  if ('error' in result) {
    return res.status(httpStatus.BAD_REQUEST).send({ success: false, error: result.error });
  }
  return res.status(httpStatus.OK).send({ success: true, data: result.data });
});

const getTheory = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.listTheory({
    category: String(req.query.category ?? ''),
    page: Number(req.query.page ?? 1),
  });
  return res.status(httpStatus.OK).send(data);
});

const postTheory = catchAsync(async (req: Request, res: Response) => {
  const { category, question, options, correctIndex, explanation } = req.body as any;
  if (!category || !question || !Array.isArray(options) || correctIndex === undefined) {
    return res.status(httpStatus.BAD_REQUEST).send({
      error: 'category, question, options, and correctIndex are required',
    });
  }
  const data = await adminAppService.createTheory({
    category: String(category),
    question: String(question),
    options: options.map((o: unknown) => String(o)),
    correctIndex: Number(correctIndex),
    explanation: explanation == null ? undefined : String(explanation),
  });
  return res.status(httpStatus.CREATED).send({ data });
});

const getTheoryById = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAppService.getTheoryById(pid(req));
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Question not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const putTheoryById = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as any;
  const data = await adminAppService.updateTheoryById(pid(req), {
    category: body.category,
    question: body.question,
    options: body.options,
    correctIndex: body.correctIndex,
    explanation: body.explanation,
  });
  if (!data) {
    return res.status(httpStatus.NOT_FOUND).send({ error: 'Question not found' });
  }
  return res.status(httpStatus.OK).send({ data });
});

const deleteTheoryById = catchAsync(async (req: Request, res: Response) => {
  await adminAppService.deleteTheoryById(pid(req));
  return res.status(httpStatus.OK).send({ success: true });
});

export default {
  getStats,
  getBookings,
  patchBookings,
  getBookingById,
  patchBookingById,
  getUsers,
  patchUsers,
  getUserById,
  deleteUserById,
  getApplications,
  patchApplications,
  getApplicationById,
  patchApplicationById,
  getAreas,
  postAreas,
  patchAreaById,
  deleteAreaById,
  getContact,
  deleteContactById,
  getCoupons,
  postCoupons,
  patchCouponById,
  getInstructors,
  patchInstructors,
  getInstructorById,
  patchInstructorById,
  getPricingCategories,
  patchPricingCategoryById,
  postPricingPackages,
  patchPricingPackageById,
  deletePricingPackageById,
  getSettings,
  patchSettings,
  postSettings,
  getTheory,
  postTheory,
  getTheoryById,
  putTheoryById,
  deleteTheoryById,
};
