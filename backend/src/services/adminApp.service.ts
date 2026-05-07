import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../client';
import { createStripeClient } from '../utils/stripeClient';
import { SETTING_KEYS } from './settings.service';

const PAGE_SIZE = 20;
const VALID_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
const VALID_PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED', 'PARTIAL_REFUND'] as const;
const VALID_USER_ROLES = ['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const;
const VALID_APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
const VALID_COUPON_TYPES = ['PERCENT', 'FIXED'] as const;

type SettingsPayload = {
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  email_from: string;
  email_admin: string;
};

const isStripePublishableKey = (value: string): boolean => /^pk_(test|live)_/.test(value);
const isStripeSecretKey = (value: string): boolean => /^sk_(test|live)_/.test(value);
const isStripeWebhookSecret = (value: string): boolean => /^whsec_/.test(value);
const normalizePromoCode = (code: string): string => code.trim().toUpperCase();

const maskKey = (value: string): string => {
  if (!value || value.length < 8) return value ? '........' : '';
  return `........${value.slice(-4)}`;
};

const normalizePage = (raw: unknown): number => {
  const parsed = Number(raw ?? 1);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
};

const parseTheoryOptions = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map((v) => String(v));
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
    } catch {
      return [];
    }
  }
  return [];
};

const legacyTableExists = async (tableName: string): Promise<boolean> => {
  const rows = await prisma.$queryRawUnsafe<Array<{ reg: string | null }>>(
    `SELECT to_regclass($1)::text AS reg`,
    `"${tableName}"`
  );
  return !!rows[0]?.reg;
};

const getSetting = async (key: string): Promise<string | null> => {
  const rows = await prisma.$queryRawUnsafe<Array<{ value: string }>>(
    `SELECT value FROM "Setting" WHERE key = $1 LIMIT 1`,
    key
  );
  return rows[0]?.value ?? null;
};

const updateSetting = async (key: string, value: string): Promise<void> => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Setting"(key, value, "updatedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    key,
    value
  );
};

const getAllSettings = async (): Promise<SettingsPayload> => {
  const [stripeSecret, stripePublishable, stripeWebhook, smtpHost, smtpPortRaw, smtpUser, smtpPass, emailFrom, emailAdmin] =
    await Promise.all([
      getSetting(SETTING_KEYS.STRIPE_SECRET_KEY),
      getSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY),
      getSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET),
      getSetting(SETTING_KEYS.SMTP_HOST),
      getSetting(SETTING_KEYS.SMTP_PORT),
      getSetting(SETTING_KEYS.SMTP_USER),
      getSetting(SETTING_KEYS.SMTP_PASS),
      getSetting(SETTING_KEYS.EMAIL_FROM),
      getSetting(SETTING_KEYS.EMAIL_ADMIN),
    ]);

  const parsedPort = Number(smtpPortRaw);
  return {
    stripe_publishable_key: stripePublishable ?? '',
    stripe_secret_key: stripeSecret ?? '',
    stripe_webhook_secret: stripeWebhook ?? '',
    smtp_host: smtpHost ?? '',
    smtp_port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 587,
    smtp_user: smtpUser ?? '',
    smtp_pass: smtpPass ?? '',
    email_from: emailFrom ?? '',
    email_admin: emailAdmin ?? '',
  };
};

const getStats = async () => {
  const totalUsersRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total FROM "User"`
  );
  const totalInstructorsRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total FROM "Instructor" WHERE "isActive" = true`
  );
  const totalBookingsRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total FROM "Booking"`
  );
  const totalRevenueRows = await prisma.$queryRawUnsafe<Array<{ total: string }>>(
    `SELECT COALESCE(SUM("totalAmount"), 0)::text AS total
     FROM "Booking"
     WHERE "paymentStatus" = 'PAID'`
  );
  const pendingApplicationsRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "InstructorApplication"
     WHERE status = 'pending'`
  );
  const newContactsTodayRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "ContactSubmission"
     WHERE "createdAt" >= date_trunc('day', now() AT TIME ZONE 'UTC')`
  );
  const bookingsThisMonthRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "Booking"
     WHERE "createdAt" >= date_trunc('month', now() AT TIME ZONE 'UTC')`
  );
  const activeAreasRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total FROM "Area" WHERE "isActive" = true`
  );

  return {
    totalUsers: totalUsersRows[0]?.total ?? 0,
    totalInstructors: totalInstructorsRows[0]?.total ?? 0,
    totalBookings: totalBookingsRows[0]?.total ?? 0,
    totalRevenue: Number(totalRevenueRows[0]?.total ?? 0),
    pendingApplications: pendingApplicationsRows[0]?.total ?? 0,
    newContactsToday: newContactsTodayRows[0]?.total ?? 0,
    bookingsThisMonth: bookingsThisMonthRows[0]?.total ?? 0,
    activeAreas: activeAreasRows[0]?.total ?? 0,
  };
};

const listBookings = async (params: { status?: string; page?: number }) => {
  const hasBooking = await legacyTableExists('Booking');
  if (!hasBooking) {
    return {
      data: [],
      total: 0,
      page: normalizePage(params.page),
      totalPages: 0,
    };
  }

  const status = params.status ?? '';
  const page = normalizePage(params.page);
  const whereStatus = VALID_BOOKING_STATUSES.includes(status as any) ? status : null;
  const offset = (page - 1) * PAGE_SIZE;

  const totalRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "Booking" b
     WHERE ($1::text IS NULL OR b.status::text = $1)`,
    whereStatus
  );
  const total = totalRows[0]?.total ?? 0;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      transmission: string;
      scheduledAt: Date;
      durationMins: number;
      status: string;
      paymentStatus: string;
      totalAmount: string;
      notes: string | null;
      studentId: string;
      studentName: string | null;
      studentEmail: string;
      instructorId: string;
      instructorUserName: string | null;
    }>
  >(
    `SELECT
       b.id, b.reference, b."lessonType"::text AS "lessonType", b.transmission, b."scheduledAt",
       b."durationMins", b.status::text AS status, b."paymentStatus"::text AS "paymentStatus",
       b."totalAmount"::text AS "totalAmount", b.notes,
       s.id AS "studentId", s.name AS "studentName", s.email AS "studentEmail",
       i.id AS "instructorId", iu.name AS "instructorUserName"
     FROM "Booking" b
     INNER JOIN "User" s ON s.id = b."studentId"
     INNER JOIN "Instructor" i ON i.id = b."instructorId"
     INNER JOIN "User" iu ON iu.id = i."userId"
     WHERE ($1::text IS NULL OR b.status::text = $1)
     ORDER BY b."scheduledAt" DESC
     OFFSET $2 LIMIT $3`,
    whereStatus,
    offset,
    PAGE_SIZE
  );

  return {
    data: rows.map((r) => ({
      id: r.id,
      reference: r.reference,
      lessonType: r.lessonType,
      transmission: r.transmission,
      scheduledAt: r.scheduledAt,
      durationMins: r.durationMins,
      status: r.status,
      paymentStatus: r.paymentStatus,
      totalAmount: Number(r.totalAmount),
      notes: r.notes,
      student: { id: r.studentId, name: r.studentName, email: r.studentEmail },
      instructor: { id: r.instructorId, user: { name: r.instructorUserName } },
    })),
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
};

const updateBookingStatus = async (id: string, status: string) => {
  await prisma.$executeRawUnsafe(
    `UPDATE "Booking" SET status = $2::"BookingStatus", "updatedAt" = NOW() WHERE id = $1`,
    id,
    status
  );
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; status: string }>>(
    `SELECT id, status::text AS status FROM "Booking" WHERE id = $1 LIMIT 1`,
    id
  );
  return rows[0] ?? null;
};

const getBookingById = async (id: string) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      transmission: string;
      scheduledAt: Date;
      durationMins: number;
      status: string;
      paymentStatus: string;
      totalAmount: string;
      notes: string | null;
      studentId: string;
      studentName: string | null;
      studentEmail: string;
      studentPhone: string | null;
      studentImage: string | null;
      instructorId: string;
      instructorUserId: string;
      instructorUserName: string | null;
      instructorUserEmail: string;
      instructorUserPhone: string | null;
      instructorUserImage: string | null;
    }>
  >(
    `SELECT
       b.id, b.reference, b."lessonType"::text AS "lessonType", b.transmission, b."scheduledAt",
       b."durationMins", b.status::text AS status, b."paymentStatus"::text AS "paymentStatus",
       b."totalAmount"::text AS "totalAmount", b.notes,
       s.id AS "studentId", s.name AS "studentName", s.email AS "studentEmail",
       s.phone AS "studentPhone", s.image AS "studentImage",
       i.id AS "instructorId", iu.id AS "instructorUserId", iu.name AS "instructorUserName",
       iu.email AS "instructorUserEmail", iu.phone AS "instructorUserPhone", iu.image AS "instructorUserImage"
     FROM "Booking" b
     INNER JOIN "User" s ON s.id = b."studentId"
     INNER JOIN "Instructor" i ON i.id = b."instructorId"
     INNER JOIN "User" iu ON iu.id = i."userId"
     WHERE b.id = $1
     LIMIT 1`,
    id
  );

  const b = rows[0];
  if (!b) return null;
  return {
    id: b.id,
    reference: b.reference,
    lessonType: b.lessonType,
    transmission: b.transmission,
    scheduledAt: b.scheduledAt,
    durationMins: b.durationMins,
    status: b.status,
    paymentStatus: b.paymentStatus,
    totalAmount: Number(b.totalAmount),
    notes: b.notes,
    student: {
      id: b.studentId,
      name: b.studentName,
      email: b.studentEmail,
      phone: b.studentPhone,
      image: b.studentImage,
    },
    instructor: {
      id: b.instructorId,
      user: {
        id: b.instructorUserId,
        name: b.instructorUserName,
        email: b.instructorUserEmail,
        phone: b.instructorUserPhone,
        image: b.instructorUserImage,
      },
    },
  };
};

const patchBookingById = async (
  id: string,
  payload: { status?: string; paymentStatus?: string; notes?: string | null }
) => {
  await prisma.$executeRawUnsafe(
    `UPDATE "Booking"
     SET status = COALESCE($2::"BookingStatus", status),
         "paymentStatus" = COALESCE($3::"PaymentStatus", "paymentStatus"),
         notes = COALESCE($4::text, notes),
         "updatedAt" = NOW()
     WHERE id = $1`,
    id,
    payload.status ?? null,
    payload.paymentStatus ?? null,
    payload.notes === undefined ? null : payload.notes
  );

  const row = await getBookingById(id);
  return row;
};

const listUsers = async (params: { search?: string; role?: string; page?: number }) => {
  const page = normalizePage(params.page);
  const role = VALID_USER_ROLES.includes((params.role ?? '') as any) ? params.role : null;
  const search = params.search?.trim() || null;
  const offset = (page - 1) * PAGE_SIZE;

  const totalRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "User" u
     WHERE ($1::text IS NULL OR u.role::text = $1)
       AND ($2::text IS NULL OR u.name ILIKE ('%' || $2 || '%') OR u.email ILIKE ('%' || $2 || '%'))`,
    role,
    search
  );
  const total = totalRows[0]?.total ?? 0;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      phone: string | null;
      image: string | null;
      createdAt: Date;
      bookingsCount: number;
    }>
  >(
    `SELECT
       u.id, u.name, u.email, u.role::text AS role, u.phone, u.image, u."createdAt",
       COUNT(b.id)::int AS "bookingsCount"
     FROM "User" u
     LEFT JOIN "Booking" b ON b."studentId" = u.id
     WHERE ($1::text IS NULL OR u.role::text = $1)
       AND ($2::text IS NULL OR u.name ILIKE ('%' || $2 || '%') OR u.email ILIKE ('%' || $2 || '%'))
     GROUP BY u.id
     ORDER BY u."createdAt" DESC
     OFFSET $3 LIMIT $4`,
    role,
    search,
    offset,
    PAGE_SIZE
  );

  return {
    data: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      image: u.image,
      createdAt: u.createdAt,
      _count: { bookings: u.bookingsCount },
    })),
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
};

const updateUserRole = async (id: string, role: string) => {
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET role = $2::"Role", "updatedAt" = NOW() WHERE id = $1`,
    id,
    role
  );
  const rows = await prisma.$queryRawUnsafe<
    Array<{ id: string; name: string | null; email: string; role: string }>
  >(
    `SELECT id, name, email, role::text AS role
     FROM "User"
     WHERE id = $1
     LIMIT 1`,
    id
  );
  return rows[0] ?? null;
};

const getUserById = async (id: string) => {
  const users = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      phone: string | null;
      image: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    `SELECT id, name, email, role::text AS role, phone, image, "createdAt", "updatedAt"
     FROM "User"
     WHERE id = $1
     LIMIT 1`,
    id
  );
  const user = users[0];
  if (!user) return null;

  const bookings = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      transmission: string;
      scheduledAt: Date;
      durationMins: number;
      status: string;
      paymentStatus: string;
      totalAmount: string;
      notes: string | null;
      instructorId: string;
      instructorUserName: string | null;
    }>
  >(
    `SELECT
       b.id, b.reference, b."lessonType"::text AS "lessonType", b.transmission, b."scheduledAt",
       b."durationMins", b.status::text AS status, b."paymentStatus"::text AS "paymentStatus",
       b."totalAmount"::text AS "totalAmount", b.notes,
       i.id AS "instructorId", iu.name AS "instructorUserName"
     FROM "Booking" b
     INNER JOIN "Instructor" i ON i.id = b."instructorId"
     INNER JOIN "User" iu ON iu.id = i."userId"
     WHERE b."studentId" = $1
     ORDER BY b."scheduledAt" DESC
     LIMIT 10`,
    id
  );

  return {
    ...user,
    bookings: bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      lessonType: b.lessonType,
      transmission: b.transmission,
      scheduledAt: b.scheduledAt,
      durationMins: b.durationMins,
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalAmount: Number(b.totalAmount),
      notes: b.notes,
      instructor: {
        id: b.instructorId,
        user: { name: b.instructorUserName },
      },
    })),
  };
};

const deleteUserById = async (id: string) => {
  await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = $1`, id);
  return true;
};

const listApplications = async (params: { status?: string; page?: number }) => {
  const hasApplication = await legacyTableExists('InstructorApplication');
  if (!hasApplication) {
    return {
      data: [],
      total: 0,
      page: normalizePage(params.page),
      totalPages: 0,
    };
  }

  const status = VALID_APPLICATION_STATUSES.includes((params.status ?? '') as any)
    ? params.status
    : null;
  const page = normalizePage(params.page);
  const offset = (page - 1) * PAGE_SIZE;

  const totalRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "InstructorApplication"
     WHERE ($1::text IS NULL OR status = $1)`,
    status
  );
  const total = totalRows[0]?.total ?? 0;

  const data = await prisma.$queryRawUnsafe<any[]>(
    `SELECT *
     FROM "InstructorApplication"
     WHERE ($1::text IS NULL OR status = $1)
     ORDER BY "createdAt" DESC
     OFFSET $2 LIMIT $3`,
    status,
    offset,
    PAGE_SIZE
  );

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
};

const updateApplicationStatus = async (id: string, status: string) => {
  await prisma.$executeRawUnsafe(
    `UPDATE "InstructorApplication" SET status = $2 WHERE id = $1`,
    id,
    status
  );
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "InstructorApplication" WHERE id = $1 LIMIT 1`,
    id
  );
  return rows[0] ?? null;
};

const getApplicationById = async (id: string) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "InstructorApplication" WHERE id = $1 LIMIT 1`,
    id
  );
  return rows[0] ?? null;
};

const listAreas = async () => {
  const hasArea = await legacyTableExists('Area');
  if (!hasArea) {
    return [];
  }
  return prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Area" ORDER BY name ASC`);
};

const createArea = async (payload: {
  name: string;
  postcodePrefix: string;
  description?: string;
  isActive?: boolean;
}) => {
  const id = uuidv4();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "Area"(id, name, "postcodePrefix", description, "isActive")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    id,
    payload.name,
    payload.postcodePrefix,
    payload.description ?? '',
    payload.isActive ?? true
  );
  return rows[0] ?? null;
};

const updateAreaById = async (
  id: string,
  payload: {
    name?: string;
    postcodePrefix?: string;
    description?: string;
    isActive?: boolean;
  }
) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "Area"
     SET name = COALESCE($2, name),
         "postcodePrefix" = COALESCE($3, "postcodePrefix"),
         description = COALESCE($4, description),
         "isActive" = COALESCE($5, "isActive")
     WHERE id = $1
     RETURNING *`,
    id,
    payload.name ?? null,
    payload.postcodePrefix ?? null,
    payload.description ?? null,
    typeof payload.isActive === 'boolean' ? payload.isActive : null
  );
  return rows[0] ?? null;
};

const deleteAreaById = async (id: string) => {
  await prisma.$executeRawUnsafe(`DELETE FROM "Area" WHERE id = $1`, id);
  return true;
};

const listContacts = async (params: { page?: number }) => {
  const hasContact = await legacyTableExists('ContactSubmission');
  if (!hasContact) {
    return {
      data: [],
      total: 0,
      page: normalizePage(params.page),
      totalPages: 0,
    };
  }

  const page = normalizePage(params.page);
  const offset = (page - 1) * PAGE_SIZE;
  const totalRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total FROM "ContactSubmission"`
  );
  const total = totalRows[0]?.total ?? 0;
  const data = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "ContactSubmission"
     ORDER BY "createdAt" DESC
     OFFSET $1 LIMIT $2`,
    offset,
    PAGE_SIZE
  );
  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
};

const deleteContactById = async (id: string) => {
  await prisma.$executeRawUnsafe(`DELETE FROM "ContactSubmission" WHERE id = $1`, id);
  return true;
};

const listCoupons = async () => {
  const hasCoupon = await legacyTableExists('Coupon');
  if (!hasCoupon) {
    return [];
  }

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      code: string;
      name: string | null;
      type: string;
      value: string;
      maxDiscountAmount: string | null;
      minOrderAmount: string | null;
      startsAt: Date | null;
      endsAt: Date | null;
      maxRedemptions: number | null;
      redemptionCount: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    `SELECT id, code, name, type::text AS type, value::text AS value,
            "maxDiscountAmount"::text AS "maxDiscountAmount",
            "minOrderAmount"::text AS "minOrderAmount",
            "startsAt", "endsAt", "maxRedemptions", "redemptionCount",
            "isActive", "createdAt", "updatedAt"
     FROM "Coupon"
     ORDER BY "createdAt" DESC`
  );

  return rows.map((c) => ({
    ...c,
    value: Number(c.value),
    maxDiscountAmount: c.maxDiscountAmount != null ? Number(c.maxDiscountAmount) : null,
    minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
  }));
};

const createCoupon = async (payload: {
  code: string;
  name?: string | null;
  type: string;
  value: number;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptions?: number | null;
  isActive?: boolean;
}) => {
  const hasCoupon = await legacyTableExists('Coupon');
  if (!hasCoupon) {
    return null;
  }

  const id = uuidv4();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "Coupon"(
       id, code, name, type, value, "maxDiscountAmount", "minOrderAmount",
       "startsAt", "endsAt", "maxRedemptions", "isActive", "createdAt", "updatedAt"
     ) VALUES (
       $1, $2, $3, $4::"CouponType", $5::decimal, $6::decimal, $7::decimal,
       $8::timestamp, $9::timestamp, $10, $11, NOW(), NOW()
     )
     RETURNING *`,
    id,
    normalizePromoCode(payload.code),
    payload.name ?? null,
    payload.type,
    payload.value,
    payload.maxDiscountAmount ?? null,
    payload.minOrderAmount ?? null,
    payload.startsAt ? new Date(payload.startsAt).toISOString() : null,
    payload.endsAt ? new Date(payload.endsAt).toISOString() : null,
    payload.maxRedemptions ?? null,
    payload.isActive ?? true
  );
  return rows[0] ?? null;
};

const patchCouponById = async (id: string, payload: { isActive?: boolean }) => {
  const hasCoupon = await legacyTableExists('Coupon');
  if (!hasCoupon) {
    return null;
  }

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "Coupon"
     SET "isActive" = COALESCE($2, "isActive"),
         "updatedAt" = NOW()
     WHERE id = $1
     RETURNING *`,
    id,
    typeof payload.isActive === 'boolean' ? payload.isActive : null
  );
  return rows[0] ?? null;
};

const listInstructors = async (params: { search?: string; isActive?: string | null }) => {
  const hasInstructor = await legacyTableExists('Instructor');
  if (!hasInstructor) {
    return [];
  }

  const search = params.search?.trim() || null;
  const isActive =
    params.isActive === 'true' ? true : params.isActive === 'false' ? false : null;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      userId: string;
      bio: string | null;
      rating: string;
      reviewCount: number;
      yearsExp: number;
      licenceNumber: string | null;
      transmission: string[] | null;
      areas: string[] | null;
      pricePerHour: string;
      isFemale: boolean;
      isActive: boolean;
      createdAt: Date;
      userName: string | null;
      userEmail: string;
      userImage: string | null;
      userCreatedAt: Date;
      bookingsCount: number;
    }>
  >(
    `SELECT
       i.id, i."userId", i.bio, i.rating::text AS rating, i."reviewCount", i."yearsExp",
       i."licenceNumber", i.transmission, i.areas, i."pricePerHour"::text AS "pricePerHour",
       i."isFemale", i."isActive", i."createdAt",
       u.name AS "userName", u.email AS "userEmail", u.image AS "userImage", u."createdAt" AS "userCreatedAt",
       COUNT(b.id)::int AS "bookingsCount"
     FROM "Instructor" i
     INNER JOIN "User" u ON u.id = i."userId"
     LEFT JOIN "Booking" b ON b."instructorId" = i.id
     WHERE ($1::boolean IS NULL OR i."isActive" = $1)
       AND ($2::text IS NULL OR u.name ILIKE ('%' || $2 || '%'))
     GROUP BY i.id, u.id
     ORDER BY u.name ASC`
    ,
    isActive,
    search
  );

  return rows.map((inst) => ({
    id: inst.id,
    userId: inst.userId,
    bio: inst.bio,
    rating: Number(inst.rating),
    reviewCount: inst.reviewCount,
    yearsExp: inst.yearsExp,
    licenceNumber: inst.licenceNumber,
    transmission: inst.transmission ?? [],
    areas: inst.areas ?? [],
    pricePerHour: Number(inst.pricePerHour),
    isFemale: inst.isFemale,
    isActive: inst.isActive,
    createdAt: inst.createdAt,
    user: {
      id: inst.userId,
      name: inst.userName,
      email: inst.userEmail,
      image: inst.userImage,
      createdAt: inst.userCreatedAt,
    },
    _count: { bookings: inst.bookingsCount },
  }));
};

const patchInstructorById = async (
  id: string,
  payload: {
    isActive?: boolean;
    pricePerHour?: number;
    bio?: string | null;
    rating?: number;
    reviewCount?: number;
    yearsExp?: number;
    areas?: string[];
    transmission?: string[];
    isFemale?: boolean;
  }
) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "Instructor"
     SET "isActive" = COALESCE($2, "isActive"),
         "pricePerHour" = COALESCE($3::decimal, "pricePerHour"),
         bio = COALESCE($4::text, bio),
         rating = COALESCE($5::double precision, rating),
         "reviewCount" = COALESCE($6::int, "reviewCount"),
         "yearsExp" = COALESCE($7::int, "yearsExp"),
         areas = COALESCE($8::text[], areas),
         transmission = COALESCE($9::text[], transmission),
         "isFemale" = COALESCE($10, "isFemale")
     WHERE id = $1
     RETURNING *`,
    id,
    typeof payload.isActive === 'boolean' ? payload.isActive : null,
    typeof payload.pricePerHour === 'number' ? payload.pricePerHour : null,
    payload.bio === undefined ? null : payload.bio,
    typeof payload.rating === 'number' ? payload.rating : null,
    typeof payload.reviewCount === 'number' ? payload.reviewCount : null,
    typeof payload.yearsExp === 'number' ? payload.yearsExp : null,
    Array.isArray(payload.areas) ? payload.areas : null,
    Array.isArray(payload.transmission) ? payload.transmission : null,
    typeof payload.isFemale === 'boolean' ? payload.isFemale : null
  );
  return rows[0] ?? null;
};

const getInstructorById = async (id: string) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      userId: string;
      bio: string | null;
      rating: string;
      reviewCount: number;
      yearsExp: number;
      licenceNumber: string | null;
      transmission: string[] | null;
      areas: string[] | null;
      pricePerHour: string;
      isFemale: boolean;
      isActive: boolean;
      createdAt: Date;
      userName: string | null;
      userEmail: string;
      userPhone: string | null;
      userImage: string | null;
      userCreatedAt: Date;
      bookingsCount: number;
    }>
  >(
    `SELECT
       i.id, i."userId", i.bio, i.rating::text AS rating, i."reviewCount", i."yearsExp",
       i."licenceNumber", i.transmission, i.areas, i."pricePerHour"::text AS "pricePerHour",
       i."isFemale", i."isActive", i."createdAt",
       u.name AS "userName", u.email AS "userEmail", u.phone AS "userPhone", u.image AS "userImage", u."createdAt" AS "userCreatedAt",
       (SELECT COUNT(*)::int FROM "Booking" b WHERE b."instructorId" = i.id) AS "bookingsCount"
     FROM "Instructor" i
     INNER JOIN "User" u ON u.id = i."userId"
     WHERE i.id = $1
     LIMIT 1`,
    id
  );
  const instructor = rows[0];
  if (!instructor) return null;

  const bookings = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      reference: string;
      lessonType: string;
      transmission: string;
      scheduledAt: Date;
      durationMins: number;
      status: string;
      paymentStatus: string;
      totalAmount: string;
      studentName: string | null;
    }>
  >(
    `SELECT
       b.id, b.reference, b."lessonType"::text AS "lessonType", b.transmission, b."scheduledAt",
       b."durationMins", b.status::text AS status, b."paymentStatus"::text AS "paymentStatus",
       b."totalAmount"::text AS "totalAmount", s.name AS "studentName"
     FROM "Booking" b
     INNER JOIN "User" s ON s.id = b."studentId"
     WHERE b."instructorId" = $1
     ORDER BY b."scheduledAt" DESC
     LIMIT 10`,
    id
  );

  return {
    id: instructor.id,
    userId: instructor.userId,
    bio: instructor.bio,
    rating: Number(instructor.rating),
    reviewCount: instructor.reviewCount,
    yearsExp: instructor.yearsExp,
    licenceNumber: instructor.licenceNumber,
    transmission: instructor.transmission ?? [],
    areas: instructor.areas ?? [],
    pricePerHour: Number(instructor.pricePerHour),
    isFemale: instructor.isFemale,
    isActive: instructor.isActive,
    createdAt: instructor.createdAt,
    user: {
      id: instructor.userId,
      name: instructor.userName,
      email: instructor.userEmail,
      phone: instructor.userPhone,
      image: instructor.userImage,
      createdAt: instructor.userCreatedAt,
    },
    bookings: bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      lessonType: b.lessonType,
      transmission: b.transmission,
      scheduledAt: b.scheduledAt,
      durationMins: b.durationMins,
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalAmount: Number(b.totalAmount),
      student: { name: b.studentName },
    })),
    _count: { bookings: instructor.bookingsCount },
  };
};

const listPricingCategories = async () => {
  const hasCategory = await legacyTableExists('LessonPricingCategory');
  const hasPackage = await legacyTableExists('LessonPricingPackage');
  if (!hasCategory || !hasPackage) {
    return [];
  }

  const categories = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "lessonType"::text AS "lessonType", slug, "displayName", description, "sortOrder", "isActive"
     FROM "LessonPricingCategory"
     ORDER BY "sortOrder" ASC`
  );
  const packages = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "categoryId", slug, name, hours, lessons,
            price::text AS price, "pricePerHour"::text AS "pricePerHour",
            savings::text AS savings, "footerNote", badge, "isPopular", "sortOrder", "isActive"
     FROM "LessonPricingPackage"
     ORDER BY "sortOrder" ASC`
  );

  const pkgByCategory = new Map<string, any[]>();
  for (const p of packages) {
    const list = pkgByCategory.get(p.categoryId) ?? [];
    list.push({
      id: p.id,
      categoryId: p.categoryId,
      slug: p.slug,
      name: p.name,
      hours: p.hours,
      lessons: p.lessons,
      price: Number(p.price),
      pricePerHour: p.pricePerHour == null ? null : Number(p.pricePerHour),
      pricePerLesson: p.lessons > 0 ? Math.round((Number(p.price) / p.lessons) * 100) / 100 : 0,
      savings: p.savings == null ? null : Number(p.savings),
      footerNote: p.footerNote,
      badge: p.badge,
      isPopular: p.isPopular,
      sortOrder: p.sortOrder,
      isActive: p.isActive,
    });
    pkgByCategory.set(p.categoryId, list);
  }

  return categories.map((c) => ({
    id: c.id,
    lessonType: c.lessonType,
    slug: c.slug,
    displayName: c.displayName,
    description: c.description,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    packages: pkgByCategory.get(c.id) ?? [],
  }));
};

const patchPricingCategory = async (
  id: string,
  payload: {
    displayName?: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }
) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "LessonPricingCategory"
     SET "displayName" = COALESCE($2, "displayName"),
         slug = COALESCE($3, slug),
         description = COALESCE($4, description),
         "sortOrder" = COALESCE($5, "sortOrder"),
         "isActive" = COALESCE($6, "isActive"),
         "updatedAt" = NOW()
     WHERE id = $1
     RETURNING *`,
    id,
    payload.displayName ?? null,
    payload.slug ?? null,
    payload.description ?? null,
    typeof payload.sortOrder === 'number' ? payload.sortOrder : null,
    typeof payload.isActive === 'boolean' ? payload.isActive : null
  );
  return rows[0] ?? null;
};

const createPricingPackage = async (payload: {
  categoryId: string;
  slug: string;
  name: string;
  hours: number;
  lessons: number;
  price: number;
  pricePerHour?: number | null;
  savings?: number | null;
  footerNote?: string | null;
  badge?: string | null;
  isPopular?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}) => {
  const id = uuidv4();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "LessonPricingPackage"(
      id, "categoryId", slug, name, hours, lessons, price, "pricePerHour", savings,
      "footerNote", badge, "isPopular", "sortOrder", "isActive", "createdAt", "updatedAt"
     ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::decimal, $8::decimal, $9::decimal,
      $10, $11, $12, $13, $14, NOW(), NOW()
     )
     RETURNING *`,
    id,
    payload.categoryId,
    payload.slug,
    payload.name,
    payload.hours,
    payload.lessons,
    payload.price,
    payload.pricePerHour ?? null,
    payload.savings ?? null,
    payload.footerNote ?? null,
    payload.badge ?? null,
    payload.isPopular ?? false,
    payload.sortOrder ?? 0,
    payload.isActive ?? true
  );
  return rows[0] ?? null;
};

const patchPricingPackage = async (
  id: string,
  payload: {
    slug?: string;
    name?: string;
    hours?: number;
    lessons?: number;
    price?: number;
    pricePerHour?: number | null;
    savings?: number | null;
    footerNote?: string | null;
    badge?: string | null;
    isPopular?: boolean;
    sortOrder?: number;
    isActive?: boolean;
  }
) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "LessonPricingPackage"
     SET slug = COALESCE($2, slug),
         name = COALESCE($3, name),
         hours = COALESCE($4, hours),
         lessons = COALESCE($5, lessons),
         price = COALESCE($6::decimal, price),
         "pricePerHour" = COALESCE($7::decimal, "pricePerHour"),
         savings = COALESCE($8::decimal, savings),
         "footerNote" = COALESCE($9, "footerNote"),
         badge = COALESCE($10, badge),
         "isPopular" = COALESCE($11, "isPopular"),
         "sortOrder" = COALESCE($12, "sortOrder"),
         "isActive" = COALESCE($13, "isActive"),
         "updatedAt" = NOW()
     WHERE id = $1
     RETURNING *`,
    id,
    payload.slug ?? null,
    payload.name ?? null,
    typeof payload.hours === 'number' ? payload.hours : null,
    typeof payload.lessons === 'number' ? payload.lessons : null,
    typeof payload.price === 'number' ? payload.price : null,
    payload.pricePerHour === undefined ? null : payload.pricePerHour,
    payload.savings === undefined ? null : payload.savings,
    payload.footerNote === undefined ? null : payload.footerNote,
    payload.badge === undefined ? null : payload.badge,
    typeof payload.isPopular === 'boolean' ? payload.isPopular : null,
    typeof payload.sortOrder === 'number' ? payload.sortOrder : null,
    typeof payload.isActive === 'boolean' ? payload.isActive : null
  );
  return rows[0] ?? null;
};

const deactivatePricingPackage = async (id: string) => {
  await prisma.$executeRawUnsafe(
    `UPDATE "LessonPricingPackage" SET "isActive" = false, "updatedAt" = NOW() WHERE id = $1`,
    id
  );
  return true;
};

const getSettings = async () => {
  const settings = await getAllSettings();
  return {
    stripe_publishable_key: settings.stripe_publishable_key,
    stripe_secret_key_masked: maskKey(settings.stripe_secret_key),
    stripe_webhook_secret_masked: maskKey(settings.stripe_webhook_secret),
    has_secret_key: !!settings.stripe_secret_key,
    has_webhook_secret: !!settings.stripe_webhook_secret,
    has_publishable_key: !!settings.stripe_publishable_key,
    mode: settings.stripe_publishable_key?.startsWith('pk_live_') ? 'live' : 'test',
    smtp_host: settings.smtp_host,
    smtp_port: settings.smtp_port,
    smtp_user: settings.smtp_user,
    smtp_pass_masked: maskKey(settings.smtp_pass),
    email_from: settings.email_from,
    email_admin: settings.email_admin,
    has_smtp_pass: !!settings.smtp_pass,
    has_smtp_config: !!(
      settings.smtp_host &&
      settings.smtp_user &&
      settings.smtp_pass &&
      settings.email_from &&
      settings.email_admin
    ),
  };
};

const patchSettings = async (payload: Record<string, unknown>) => {
  const updates: Promise<void>[] = [];

  if (payload.stripe_publishable_key !== undefined && payload.stripe_publishable_key !== '') {
    const value = String(payload.stripe_publishable_key);
    if (!isStripePublishableKey(value)) {
      return { error: 'Invalid Stripe publishable key format' };
    }
    updates.push(updateSetting(SETTING_KEYS.STRIPE_PUBLISHABLE_KEY, value));
  }

  if (payload.stripe_secret_key !== undefined && payload.stripe_secret_key !== '') {
    const value = String(payload.stripe_secret_key);
    if (!isStripeSecretKey(value)) {
      return { error: 'Invalid Stripe secret key format' };
    }
    updates.push(updateSetting(SETTING_KEYS.STRIPE_SECRET_KEY, value));
  }

  if (payload.stripe_webhook_secret !== undefined && payload.stripe_webhook_secret !== '') {
    const value = String(payload.stripe_webhook_secret);
    if (!isStripeWebhookSecret(value)) {
      return { error: 'Invalid Stripe webhook secret format' };
    }
    updates.push(updateSetting(SETTING_KEYS.STRIPE_WEBHOOK_SECRET, value));
  }

  if (payload.smtp_host !== undefined && payload.smtp_host !== '') {
    updates.push(updateSetting(SETTING_KEYS.SMTP_HOST, String(payload.smtp_host).trim()));
  }

  if (payload.smtp_port !== undefined && payload.smtp_port !== '') {
    const parsedPort = Number(payload.smtp_port);
    if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
      return { error: 'Invalid SMTP port' };
    }
    updates.push(updateSetting(SETTING_KEYS.SMTP_PORT, String(parsedPort)));
  }

  if (payload.smtp_user !== undefined && payload.smtp_user !== '') {
    updates.push(updateSetting(SETTING_KEYS.SMTP_USER, String(payload.smtp_user).trim()));
  }
  if (payload.smtp_pass !== undefined && payload.smtp_pass !== '') {
    updates.push(updateSetting(SETTING_KEYS.SMTP_PASS, String(payload.smtp_pass)));
  }
  if (payload.email_from !== undefined && payload.email_from !== '') {
    updates.push(updateSetting(SETTING_KEYS.EMAIL_FROM, String(payload.email_from).trim()));
  }
  if (payload.email_admin !== undefined && payload.email_admin !== '') {
    updates.push(updateSetting(SETTING_KEYS.EMAIL_ADMIN, String(payload.email_admin).trim()));
  }

  if (updates.length === 0) {
    return { error: 'No valid fields to update' };
  }

  await Promise.all(updates);
  return { ok: true };
};

const testSettings = async (action: string) => {
  if (action === 'test_connection') {
    const secretKey = (await getSetting(SETTING_KEYS.STRIPE_SECRET_KEY)) ?? '';
    if (!secretKey) {
      return { error: 'No Stripe secret key configured' };
    }

    try {
      const stripe = createStripeClient(secretKey);
      const balance = await stripe.balance.retrieve();
      return {
        data: {
          connected: true,
          currency: balance.available[0]?.currency?.toUpperCase() ?? 'GBP',
        },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Connection failed' };
    }
  }

  if (action === 'test_smtp') {
    const smtp = await getAllSettings();
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass || !smtp.email_from) {
      return { error: 'SMTP is not fully configured' };
    }

    try {
      const transport = nodemailer.createTransport({
        host: smtp.smtp_host,
        port: smtp.smtp_port,
        secure: smtp.smtp_port === 465,
        auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
      });
      await transport.verify();
      return {
        data: { connected: true, host: smtp.smtp_host, port: smtp.smtp_port },
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'SMTP connection failed' };
    }
  }

  return { error: 'Unknown action' };
};

const listTheory = async (params: { category?: string; page?: number }) => {
  const hasTheory = await legacyTableExists('TheoryQuestion');
  if (!hasTheory) {
    return { data: [], total: 0, page: normalizePage(params.page), totalPages: 0 };
  }

  const page = normalizePage(params.page);
  const category = params.category?.trim() || null;
  const offset = (page - 1) * PAGE_SIZE;
  const totalRows = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*)::int AS total
     FROM "TheoryQuestion"
     WHERE ($1::text IS NULL OR category = $1)`,
    category
  );
  const total = totalRows[0]?.total ?? 0;
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "TheoryQuestion"
     WHERE ($1::text IS NULL OR category = $1)
     ORDER BY category ASC
     OFFSET $2 LIMIT $3`,
    category,
    offset,
    PAGE_SIZE
  );
  return {
    data: rows.map((r) => ({ ...r, options: parseTheoryOptions(r.options) })),
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
};

const createTheory = async (payload: {
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}) => {
  const id = uuidv4();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "TheoryQuestion"(id, category, question, options, "correctIndex", explanation)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     RETURNING *`,
    id,
    payload.category,
    payload.question,
    JSON.stringify(payload.options),
    payload.correctIndex,
    payload.explanation ?? null
  );
  const row = rows[0];
  return row ? { ...row, options: parseTheoryOptions(row.options) } : null;
};

const getTheoryById = async (id: string) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "TheoryQuestion" WHERE id = $1 LIMIT 1`,
    id
  );
  const row = rows[0];
  return row ? { ...row, options: parseTheoryOptions(row.options) } : null;
};

const updateTheoryById = async (
  id: string,
  payload: {
    category?: string;
    question?: string;
    options?: string[];
    correctIndex?: number;
    explanation?: string;
  }
) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `UPDATE "TheoryQuestion"
     SET category = COALESCE($2, category),
         question = COALESCE($3, question),
         options = COALESCE($4::jsonb, options),
         "correctIndex" = COALESCE($5, "correctIndex"),
         explanation = COALESCE($6, explanation)
     WHERE id = $1
     RETURNING *`,
    id,
    payload.category ?? null,
    payload.question ?? null,
    payload.options ? JSON.stringify(payload.options) : null,
    typeof payload.correctIndex === 'number' ? payload.correctIndex : null,
    payload.explanation ?? null
  );
  const row = rows[0];
  return row ? { ...row, options: parseTheoryOptions(row.options) } : null;
};

const deleteTheoryById = async (id: string) => {
  await prisma.$executeRawUnsafe(`DELETE FROM "TheoryQuestion" WHERE id = $1`, id);
  return true;
};

export default {
  VALID_BOOKING_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_USER_ROLES,
  VALID_APPLICATION_STATUSES,
  VALID_COUPON_TYPES,
  getStats,
  listBookings,
  updateBookingStatus,
  getBookingById,
  patchBookingById,
  listUsers,
  updateUserRole,
  getUserById,
  deleteUserById,
  listApplications,
  updateApplicationStatus,
  getApplicationById,
  listAreas,
  createArea,
  updateAreaById,
  deleteAreaById,
  listContacts,
  deleteContactById,
  listCoupons,
  createCoupon,
  patchCouponById,
  listInstructors,
  patchInstructorById,
  getInstructorById,
  listPricingCategories,
  patchPricingCategory,
  createPricingPackage,
  patchPricingPackage,
  deactivatePricingPackage,
  getSettings,
  patchSettings,
  testSettings,
  listTheory,
  createTheory,
  getTheoryById,
  updateTheoryById,
  deleteTheoryById,
};
