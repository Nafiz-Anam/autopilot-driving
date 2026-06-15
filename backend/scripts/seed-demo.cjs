/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seed-demo');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(`SELECT to_regclass($1)::text AS reg`, `"${tableName}"`);
  return !!rows?.[0]?.reg;
}

async function ensureDrivingSchoolSchema() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "LessonType" AS ENUM ('MANUAL', 'AUTOMATIC', 'INTENSIVE', 'THEORY', 'REFRESHER', 'PASS_PLUS', 'MOTORWAY', 'MOCK_TEST');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  // Add new enum values to existing DB (idempotent)
  await prisma.$executeRawUnsafe(`ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'REFRESHER'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'PASS_PLUS'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'MOTORWAY'`);
  await prisma.$executeRawUnsafe(`ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'MOCK_TEST'`);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Area" (
      id text PRIMARY KEY,
      name text NOT NULL,
      "postcodePrefix" text NOT NULL,
      description text,
      "isActive" boolean NOT NULL DEFAULT true
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Instructor" (
      id text PRIMARY KEY,
      "userId" text NOT NULL UNIQUE,
      bio text,
      "photoUrl" text,
      rating double precision NOT NULL DEFAULT 0,
      "reviewCount" integer NOT NULL DEFAULT 0,
      "yearsExp" integer NOT NULL DEFAULT 0,
      transmission text[] NOT NULL DEFAULT ARRAY[]::text[],
      areas text[] NOT NULL DEFAULT ARRAY[]::text[],
      "pricePerHour" numeric(10,2) NOT NULL DEFAULT 0,
      "isFemale" boolean NOT NULL DEFAULT false,
      "isActive" boolean NOT NULL DEFAULT true,
      "licenceNumber" text,
      "createdAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InstructorApplication" (
      id text PRIMARY KEY,
      "fullName" text NOT NULL,
      email text NOT NULL,
      phone text,
      postcode text,
      "hasFullLicence" boolean NOT NULL DEFAULT false,
      "yearsExperience" text,
      "trainingStarted" boolean NOT NULL DEFAULT false,
      message text,
      status text NOT NULL DEFAULT 'pending',
      "createdAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ContactSubmission" (
      id text PRIMARY KEY,
      name text NOT NULL,
      phone text,
      postcode text,
      "enquiryType" text,
      "callTime" text,
      message text,
      "createdAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LessonPricingCategory" (
      id text PRIMARY KEY,
      "lessonType" "LessonType" NOT NULL UNIQUE,
      slug text NOT NULL UNIQUE,
      "displayName" text NOT NULL,
      description text,
      "sortOrder" integer NOT NULL DEFAULT 0,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT NOW(),
      "updatedAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LessonPricingPackage" (
      id text PRIMARY KEY,
      "categoryId" text NOT NULL,
      slug text NOT NULL,
      name text NOT NULL,
      hours integer NOT NULL DEFAULT 1,
      lessons integer NOT NULL DEFAULT 1,
      price numeric(10,2) NOT NULL DEFAULT 0,
      "pricePerHour" numeric(10,2) NOT NULL DEFAULT 0,
      savings numeric(10,2),
      "footerNote" text,
      badge text,
      "isPopular" boolean NOT NULL DEFAULT false,
      "sortOrder" integer NOT NULL DEFAULT 0,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT NOW(),
      "updatedAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Coupon" (
      id text PRIMARY KEY,
      code text NOT NULL UNIQUE,
      name text NOT NULL,
      type "CouponType" NOT NULL,
      value numeric(10,2) NOT NULL,
      "maxDiscountAmount" numeric(10,2),
      "minOrderAmount" numeric(10,2),
      "startsAt" timestamptz,
      "endsAt" timestamptz,
      "maxRedemptions" integer,
      "redemptionCount" integer NOT NULL DEFAULT 0,
      "isActive" boolean NOT NULL DEFAULT true,
      "createdAt" timestamptz NOT NULL DEFAULT NOW(),
      "updatedAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "TheoryQuestion" (
      id text PRIMARY KEY,
      category text NOT NULL,
      question text NOT NULL,
      options jsonb NOT NULL DEFAULT '[]'::jsonb,
      "correctIndex" integer NOT NULL DEFAULT 0,
      explanation text,
      "imageUrl" text
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Booking" (
      id text PRIMARY KEY,
      reference text NOT NULL UNIQUE,
      "studentId" text NOT NULL,
      "instructorId" text,
      "lessonType" "LessonType" NOT NULL,
      transmission text,
      "scheduledAt" timestamptz NOT NULL,
      "durationMins" integer NOT NULL DEFAULT 60,
      status "BookingStatus" NOT NULL DEFAULT 'PENDING',
      "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
      "stripePaymentId" text,
      "totalAmount" numeric(10,2),
      "pricingPackageId" text,
      "voucherCode" text,
      "couponCode" text,
      "discountAmount" numeric(10,2),
      notes text,
      "createdAt" timestamptz NOT NULL DEFAULT NOW(),
      "updatedAt" timestamptz NOT NULL DEFAULT NOW()
    );
  `);
}

async function seedAuthCore() {
  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@autopilot.demo' },
    update: { name: 'Demo Admin', role: 'ADMIN', isEmailVerified: true, password: passwordHash },
    create: {
      email: 'admin@autopilot.demo',
      name: 'Demo Admin',
      role: 'ADMIN',
      password: passwordHash,
      isEmailVerified: true,
      country: 'UK',
      city: 'Slough',
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@autopilot.demo' },
    update: { name: 'Demo Moderator', role: 'MODERATOR', isEmailVerified: true, password: passwordHash },
    create: {
      email: 'moderator@autopilot.demo',
      name: 'Demo Moderator',
      role: 'MODERATOR',
      password: passwordHash,
      isEmailVerified: true,
      country: 'UK',
      city: 'Reading',
    },
  });

  const basicUser = await prisma.user.upsert({
    where: { email: 'user@autopilot.demo' },
    update: { name: 'Demo User', role: 'USER', isEmailVerified: true, password: passwordHash },
    create: {
      email: 'user@autopilot.demo',
      name: 'Demo User',
      role: 'USER',
      password: passwordHash,
      isEmailVerified: true,
      country: 'UK',
      city: 'Windsor',
    },
  });

  await prisma.passwordPolicy.upsert({
    where: { name: 'Default Policy' },
    update: {},
    create: { name: 'Default Policy' },
  });

  const roles = [
    { name: 'admin', description: 'Platform administrator' },
    { name: 'moderator', description: 'Moderation role' },
    { name: 'student', description: 'Driving school student role' },
    { name: 'instructor', description: 'Driving school instructor role' },
  ];
  for (const role of roles) {
    await prisma.roleModel.upsert({
      where: { name: role.name },
      update: { description: role.description, isActive: true },
      create: role,
    });
  }

  const permissions = [
    { name: 'user.read', resource: 'user', action: 'read' },
    { name: 'user.update', resource: 'user', action: 'update' },
    { name: 'booking.read', resource: 'booking', action: 'read' },
    { name: 'booking.update', resource: 'booking', action: 'update' },
    { name: 'analytics.read', resource: 'analytics', action: 'read' },
    { name: 'system.configure', resource: 'system', action: 'configure' },
  ];
  for (const p of permissions) {
    await prisma.permissionModel.upsert({
      where: { name: p.name },
      update: { description: p.name, resource: p.resource, action: p.action },
      create: { ...p, description: p.name },
    });
  }

  const roleByName = Object.fromEntries((await prisma.roleModel.findMany()).map((r) => [r.name, r]));
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleByName.admin.id } },
    update: {},
    create: { userId: admin.id, roleId: roleByName.admin.id, assignedBy: 'seed' },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: moderator.id, roleId: roleByName.moderator.id } },
    update: {},
    create: { userId: moderator.id, roleId: roleByName.moderator.id, assignedBy: 'seed' },
  });

  const now = Date.now();
  await prisma.notification.upsert({
    where: { id: 'seed-note-admin' },
    update: {
      userId: admin.id,
      type: 'WELCOME',
      title: 'Welcome to AutoPilot Demo',
      message: 'Demo data seeded successfully for admin.',
    },
    create: {
      id: 'seed-note-admin',
      userId: admin.id,
      type: 'WELCOME',
      title: 'Welcome to AutoPilot Demo',
      message: 'Demo data seeded successfully for admin.',
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-note-student' },
    update: {
      userId: basicUser.id,
      type: 'WELCOME',
      title: 'Welcome Student',
      message: 'Use demo credentials to explore the platform.',
    },
    create: {
      id: 'seed-note-student',
      userId: basicUser.id,
      type: 'WELCOME',
      title: 'Welcome Student',
      message: 'Use demo credentials to explore the platform.',
    },
  });

  await prisma.securityLog.upsert({
    where: { id: 'seed-sec-admin' },
    update: {
      userId: admin.id,
      email: admin.email,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      eventType: 'REGISTER',
      success: true,
    },
    create: {
      id: 'seed-sec-admin',
      userId: admin.id,
      email: admin.email,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      eventType: 'REGISTER',
      success: true,
    },
  });
  await prisma.securityLog.upsert({
    where: { id: 'seed-sec-student' },
    update: {
      userId: basicUser.id,
      email: basicUser.email,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      eventType: 'LOGIN_SUCCESS',
      success: true,
    },
    create: {
      id: 'seed-sec-student',
      userId: basicUser.id,
      email: basicUser.email,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      eventType: 'LOGIN_SUCCESS',
      success: true,
    },
  });

  await prisma.userSession.upsert({
    where: { sessionId: 'seed-admin-session' },
    update: { userId: admin.id, isActive: true, expiresAt: new Date(now + 7 * 86400000) },
    create: {
      userId: admin.id,
      sessionId: 'seed-admin-session',
      deviceName: 'Seeded Browser',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      isActive: true,
      expiresAt: new Date(now + 7 * 86400000),
    },
  });

  await prisma.device.upsert({
    where: { deviceId: 'seed-admin-device' },
    update: { userId: admin.id, deviceName: 'Seeded Mac', deviceType: 'DESKTOP', isTrusted: true },
    create: {
      userId: admin.id,
      deviceId: 'seed-admin-device',
      deviceName: 'Seeded Mac',
      deviceType: 'DESKTOP',
      isTrusted: true,
    },
  });

  const apiKeyHash = crypto.createHash('sha256').update('demo-api-key').digest('hex');
  await prisma.apiKey.upsert({
    where: { id: 'seed-demo-api-key' },
    update: { userId: admin.id, isActive: true, hashedKey: apiKeyHash },
    create: {
      id: 'seed-demo-api-key',
      userId: admin.id,
      name: 'Demo Admin API Key',
      description: 'Seeded key for local testing',
      hashedKey: apiKeyHash,
      permissions: ['user.read', 'booking.read', 'analytics.read'],
      rateLimitPerHour: 1000,
      isActive: true,
    },
  });

  await prisma.passwordHistory.upsert({
    where: { id: 'seed-pwh-admin-1' },
    update: { userId: admin.id, password: passwordHash },
    create: { id: 'seed-pwh-admin-1', userId: admin.id, password: passwordHash },
  });

  await prisma.passwordHistory.upsert({
    where: { id: 'seed-pwh-user-1' },
    update: { userId: basicUser.id, password: passwordHash },
    create: { id: 'seed-pwh-user-1', userId: basicUser.id, password: passwordHash },
  });

  await prisma.otp.upsert({
    where: { id: 'seed-otp-user-email' },
    update: {
      userId: basicUser.id,
      otp: '123456',
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      consumed: false,
    },
    create: {
      id: 'seed-otp-user-email',
      userId: basicUser.id,
      otp: '123456',
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      consumed: false,
    },
  });

  await prisma.token.upsert({
    where: { token: 'seed-access-token-admin' },
    update: {
      userId: admin.id,
      type: 'ACCESS',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      blacklisted: false,
      deviceId: 'seed-admin-device',
      deviceName: 'Seeded Mac',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
    create: {
      token: 'seed-access-token-admin',
      userId: admin.id,
      type: 'ACCESS',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      blacklisted: false,
      deviceId: 'seed-admin-device',
      deviceName: 'Seeded Mac',
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
  });

  await prisma.token.upsert({
    where: { token: 'seed-refresh-token-admin' },
    update: {
      userId: admin.id,
      type: 'REFRESH',
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      blacklisted: false,
    },
    create: {
      token: 'seed-refresh-token-admin',
      userId: admin.id,
      type: 'REFRESH',
      expires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      blacklisted: false,
    },
  });

  await prisma.userActivity.upsert({
    where: { id: 'seed-activity-admin-login' },
    update: {
      userId: admin.id,
      activityType: 'LOGIN',
      description: 'Admin logged in from dashboard',
      metadata: { source: 'seed-script' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
    create: {
      id: 'seed-activity-admin-login',
      userId: admin.id,
      activityType: 'LOGIN',
      description: 'Admin logged in from dashboard',
      metadata: { source: 'seed-script' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
  });

  await prisma.userActivity.upsert({
    where: { id: 'seed-activity-user-profile' },
    update: {
      userId: basicUser.id,
      activityType: 'PROFILE_UPDATE',
      description: 'Student profile updated',
      metadata: { source: 'seed-script' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
    create: {
      id: 'seed-activity-user-profile',
      userId: basicUser.id,
      activityType: 'PROFILE_UPDATE',
      description: 'Student profile updated',
      metadata: { source: 'seed-script' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    },
  });

  await prisma.socialAccount.upsert({
    where: { provider_providerId: { provider: 'google', providerId: 'seed-google-admin' } },
    update: {
      userId: admin.id,
      accessToken: 'seed_google_access_admin',
      refreshToken: 'seed_google_refresh_admin',
      scope: 'openid email profile',
    },
    create: {
      userId: admin.id,
      provider: 'google',
      providerId: 'seed-google-admin',
      accessToken: 'seed_google_access_admin',
      refreshToken: 'seed_google_refresh_admin',
      scope: 'openid email profile',
    },
  });

  const permissionRows = await prisma.permissionModel.findMany();
  const permissionByName = Object.fromEntries(permissionRows.map((p) => [p.name, p]));

  const rolePermissionPairs = [
    ['admin', 'user.read'],
    ['admin', 'user.update'],
    ['admin', 'analytics.read'],
    ['admin', 'system.configure'],
    ['moderator', 'user.read'],
    ['moderator', 'booking.read'],
  ];

  for (const [roleName, permissionName] of rolePermissionPairs) {
    const role = roleByName[roleName];
    const permission = permissionByName[permissionName];
    if (!role || !permission) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  await prisma.auditLog.upsert({
    where: { id: 'seed-audit-admin-user-update' },
    update: {
      userId: admin.id,
      action: 'UPDATE',
      resource: 'user',
      resourceId: basicUser.id,
      oldValues: { role: 'USER' },
      newValues: { role: 'USER' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      sessionId: 'seed-admin-session',
      requestId: 'seed-req-001',
      severity: 'INFO',
      category: 'AUTH',
    },
    create: {
      id: 'seed-audit-admin-user-update',
      userId: admin.id,
      action: 'UPDATE',
      resource: 'user',
      resourceId: basicUser.id,
      oldValues: { role: 'USER' },
      newValues: { role: 'USER' },
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      sessionId: 'seed-admin-session',
      requestId: 'seed-req-001',
      severity: 'INFO',
      category: 'AUTH',
    },
  });

  await prisma.dataProcessingRecord.upsert({
    where: { id: 'seed-dpr-user-1' },
    update: {
      userId: basicUser.id,
      purpose: 'Driving lesson booking management',
      legalBasis: 'Contract',
      dataTypes: ['name', 'email', 'phone', 'booking-history'],
      retention: '3 years',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: 'seed-dpr-user-1',
      userId: basicUser.id,
      purpose: 'Driving lesson booking management',
      legalBasis: 'Contract',
      dataTypes: ['name', 'email', 'phone', 'booking-history'],
      retention: '3 years',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.passwordBreachCheck.upsert({
    where: { id: 'seed-breach-check-admin' },
    update: {
      userId: admin.id,
      passwordHash: passwordHash,
      isBreached: false,
    },
    create: {
      id: 'seed-breach-check-admin',
      userId: admin.id,
      passwordHash: passwordHash,
      isBreached: false,
    },
  });

  await prisma.iPSecurityAnalytics.upsert({
    where: { id: 'seed-ip-analytics-localhost' },
    update: {
      ipAddress: '127.0.0.1',
      countryCode: 'GB',
      reputation: 'trusted',
      requestCount: 420,
      isBlocked: false,
      blockReason: null,
      riskScore: 0.1,
      lastSeen: new Date(),
    },
    create: {
      id: 'seed-ip-analytics-localhost',
      ipAddress: '127.0.0.1',
      countryCode: 'GB',
      reputation: 'trusted',
      requestCount: 420,
      isBlocked: false,
      blockReason: null,
      riskScore: 0.1,
      lastSeen: new Date(),
    },
  });

  await prisma.iPSecurityRule.upsert({
    where: { id: 'seed-ip-rule-whitelist-localhost' },
    update: {
      ipAddress: '127.0.0.1',
      ruleType: 'WHITELIST',
      reason: 'Local development IP',
      isActive: true,
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
      userId: admin.id,
    },
    create: {
      id: 'seed-ip-rule-whitelist-localhost',
      ipAddress: '127.0.0.1',
      ruleType: 'WHITELIST',
      reason: 'Local development IP',
      isActive: true,
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
      userId: admin.id,
    },
  });

  await prisma.sessionSecurityEvent.upsert({
    where: { id: 'seed-session-event-1' },
    update: {
      sessionId: 'seed-admin-session',
      eventType: 'SUSPICIOUS_IP',
      riskScore: 0.25,
      details: { message: 'Demo security event' },
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: admin.id,
    },
    create: {
      id: 'seed-session-event-1',
      sessionId: 'seed-admin-session',
      eventType: 'SUSPICIOUS_IP',
      riskScore: 0.25,
      details: { message: 'Demo security event' },
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy: admin.id,
    },
  });
}

async function seedDrivingSchoolTables() {
  const hasUserTable = await tableExists('users');
  if (!hasUserTable) {
    console.warn('Skipping driving-school seed: "users" table not found.');
    return;
  }

  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  // Clean up old demo data to allow fresh seed
  await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id LIKE 'seed-%' OR email LIKE '%.demo'`);

  await prisma.$executeRawUnsafe(
    `INSERT INTO users (id, name, email, phone, password, role, "isEmailVerified", gender, country, city, state, "createdAt", "updatedAt")
     VALUES
       ('seed-admin', 'Alice Admin', 'alice.admin@autopilot.demo', '07700900001', $1, 'ADMIN', true, 'FEMALE', 'UK', 'Slough', 'Berkshire', NOW(), NOW()),
       ('seed-instructor-1', 'Ian Instructor', 'ian.instructor@autopilot.demo', '07700900002', $1, 'USER', true, 'MALE', 'UK', 'Slough', 'Berkshire', NOW(), NOW()),
       ('seed-instructor-2', 'Emma Evans', 'emma.evans@autopilot.demo', '07700900004', $1, 'USER', true, 'FEMALE', 'UK', 'Reading', 'Berkshire', NOW(), NOW()),
       ('seed-instructor-3', 'David Driver', 'david.driver@autopilot.demo', '07700900005', $1, 'USER', true, 'MALE', 'UK', 'Windsor', 'Berkshire', NOW(), NOW()),
       ('seed-student-1', 'Sam Student', 'sam.student@autopilot.demo', '07700900003', $1, 'USER', true, 'MALE', 'UK', 'Slough', 'Berkshire', NOW(), NOW()),
       ('seed-student-2', 'Lisa Learner', 'lisa.learner@autopilot.demo', '07700900006', $1, 'USER', true, 'FEMALE', 'UK', 'Reading', 'Berkshire', NOW(), NOW()),
       ('seed-student-3', 'Tom Turner', 'tom.turner@autopilot.demo', '07700900007', $1, 'USER', true, 'MALE', 'UK', 'Windsor', 'Berkshire', NOW(), NOW()),
       ('seed-student-4', 'Jessica James', 'jessica.james@autopilot.demo', '07700900008', $1, 'USER', true, 'FEMALE', 'UK', 'Maidenhead', 'Berkshire', NOW(), NOW())`,
    passwordHash
  );

  if (await tableExists('Area')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Area" (id, name, "postcodePrefix", description, latitude, longitude, "isActive")
      VALUES
        ('seed-area-sl1', 'Slough', 'SL1', 'Central Slough coverage including High Street and surrounding areas', 51.5105, -0.5955, true),
        ('seed-area-sl2', 'Slough South', 'SL2', 'Southern Slough including Langley', 51.4900, -0.5800, true),
        ('seed-area-rg1', 'Reading Town Centre', 'RG1', 'Reading town centre and nearby suburbs', 51.4556, -0.9719, true),
        ('seed-area-rg2', 'Reading South', 'RG2', 'South Reading including Caversham', 51.4300, -0.9600, true),
        ('seed-area-sl4', 'Windsor', 'SL4', 'Windsor and Eton coverage including Old Windsor', 51.4769, -0.7675, true),
        ('seed-area-sl5', 'Ascot', 'SL5', 'Ascot and surrounding areas', 51.4056, -0.6606, true),
        ('seed-area-rg4', 'Henley-on-Thames', 'RG4', 'Henley and surrounding villages', 51.5344, -0.7639, true),
        ('seed-area-sl3', 'Iver', 'SL3', 'Iver and surrounding areas', 51.5097, -0.5219, true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "postcodePrefix" = EXCLUDED."postcodePrefix",
        description = EXCLUDED.description,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        "isActive" = EXCLUDED."isActive"
    `);
  }

  if (await tableExists('Instructor')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Instructor"
      (id, "userId", bio, "photoUrl", rating, "reviewCount", "yearsExp", transmission, areas, "pricePerHour", "isFemale", "isActive", "licenceNumber", "createdAt")
      VALUES
      ('seed-inst-1', 'seed-instructor-1', 'DVSA-approved instructor with 8 years experience in manual and automatic transmission. Patient and friendly approach to learning.', NULL, 4.9, 156, 8, ARRAY['manual','automatic'], ARRAY['SL1','SL2','RG1'], 42.00, false, true, 'LIC-AP-001', NOW()),
      ('seed-inst-2', 'seed-instructor-2', 'Specialist in nervous learners and intensive courses. Female instructor available. 6 years of teaching experience.', NULL, 4.8, 134, 6, ARRAY['manual','automatic'], ARRAY['RG1','RG2','RG4'], 45.00, true, true, 'LIC-AP-002', NOW()),
      ('seed-inst-3', 'seed-instructor-3', 'Expert in motorway and motorway simulation. Focuses on defensive driving techniques. 10+ years experience.', NULL, 4.7, 98, 10, ARRAY['automatic','manual'], ARRAY['SL1','SL4','SL5'], 48.00, false, true, 'LIC-AP-003', NOW())
      ON CONFLICT (id) DO UPDATE SET
        bio = EXCLUDED.bio,
        rating = EXCLUDED.rating,
        "reviewCount" = EXCLUDED."reviewCount",
        "yearsExp" = EXCLUDED."yearsExp",
        transmission = EXCLUDED.transmission,
        areas = EXCLUDED.areas,
        "pricePerHour" = EXCLUDED."pricePerHour",
        "isFemale" = EXCLUDED."isFemale",
        "isActive" = EXCLUDED."isActive",
        "licenceNumber" = EXCLUDED."licenceNumber"
    `);
  }

  if (await tableExists('Availability')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Availability" (id, "instructorId", "dayOfWeek", "startTime", "endTime", "isAvailable")
      VALUES
        -- Ian Instructor (seed-inst-1): Monday-Friday 9am-5pm
        ('seed-av-1-1', 'seed-inst-1', 1, '09:00', '17:00', true),
        ('seed-av-1-2', 'seed-inst-1', 2, '09:00', '17:00', true),
        ('seed-av-1-3', 'seed-inst-1', 3, '09:00', '17:00', true),
        ('seed-av-1-4', 'seed-inst-1', 4, '09:00', '17:00', true),
        ('seed-av-1-5', 'seed-inst-1', 5, '09:00', '17:00', true),
        ('seed-av-1-6', 'seed-inst-1', 6, '10:00', '14:00', true),
        -- Emma Evans (seed-inst-2): Tuesday-Saturday, mornings and afternoons
        ('seed-av-2-2', 'seed-inst-2', 2, '08:00', '12:00', true),
        ('seed-av-2-3', 'seed-inst-2', 3, '14:00', '18:00', true),
        ('seed-av-2-4', 'seed-inst-2', 4, '08:00', '12:00', true),
        ('seed-av-2-5', 'seed-inst-2', 5, '14:00', '18:00', true),
        ('seed-av-2-6', 'seed-inst-2', 6, '09:00', '17:00', true),
        ('seed-av-2-7', 'seed-inst-2', 7, '10:00', '16:00', true),
        -- David Driver (seed-inst-3): Weekdays afternoons and Saturday full day
        ('seed-av-3-1', 'seed-inst-3', 1, '13:00', '19:00', true),
        ('seed-av-3-2', 'seed-inst-3', 2, '13:00', '19:00', true),
        ('seed-av-3-3', 'seed-inst-3', 3, '13:00', '19:00', true),
        ('seed-av-3-4', 'seed-inst-3', 4, '13:00', '19:00', true),
        ('seed-av-3-5', 'seed-inst-3', 5, '13:00', '19:00', true),
        ('seed-av-3-6', 'seed-inst-3', 6, '08:00', '18:00', true)
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('LessonPricingCategory')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "LessonPricingCategory" (id, "lessonType", slug, "displayName", description, "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES
        ('seed-cat-manual',     'MANUAL',     'manual',            'Manual Driving Lessons',  'Learn with manual transmission',        1, true, NOW(), NOW()),
        ('seed-cat-auto',       'AUTOMATIC',  'automatic',         'Automatic Driving Lessons','Learn with automatic transmission',      2, true, NOW(), NOW()),
        ('seed-cat-intensive',  'INTENSIVE',  'intensive',         'Intensive Courses',        'Fast-track intensive course options',    3, true, NOW(), NOW()),
        ('seed-cat-theory',     'THEORY',     'theory',            'Theory Training',          'DVSA theory prep package',              4, true, NOW(), NOW()),
        ('seed-cat-refresher',  'REFRESHER',  'refresher-lessons', 'Refresher Lessons',        'Back behind the wheel after a break',   5, true, NOW(), NOW()),
        ('seed-cat-pass-plus',  'PASS_PLUS',  'pass-plus',         'Pass Plus',                'Advanced post-test training course',    6, true, NOW(), NOW()),
        ('seed-cat-motorway',   'MOTORWAY',   'motorway-lessons',  'Motorway Lessons',         'Safe motorway driving with an ADI',     7, true, NOW(), NOW()),
        ('seed-cat-mock-test',  'MOCK_TEST',  'mock-test',         'Mock Test',                'Full mock driving test session',        8, true, NOW(), NOW())
      ON CONFLICT ("lessonType") DO UPDATE SET
        slug = EXCLUDED.slug,
        "displayName" = EXCLUDED."displayName",
        description = EXCLUDED.description,
        "sortOrder" = EXCLUDED."sortOrder",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = NOW()
    `);
  }

  if (await tableExists('LessonPricingPackage')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "LessonPricingPackage"
      (id, "categoryId", slug, name, hours, lessons, price, "pricePerHour", savings, "footerNote", badge, "isPopular", "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES
        ('seed-pkg-manual-single',   'seed-cat-manual',    'single',      'Single Manual Lesson',   1,  1,  45.00,  45.00, NULL,   'Pay as you go',             NULL,          false, 1, true, NOW(), NOW()),
        ('seed-pkg-manual-block10',  'seed-cat-manual',    'block10',     'Manual 10 Hours',        10, 10, 410.00, 41.00, 40.00,  'Best for new starters',     'Popular',     true,  2, true, NOW(), NOW()),
        ('seed-pkg-auto-single',     'seed-cat-auto',      'single',      'Single Automatic Lesson',1,  1,  47.00,  47.00, NULL,   'Pay as you go',             NULL,          false, 1, true, NOW(), NOW()),
        ('seed-pkg-auto-block10',    'seed-cat-auto',      'block10',     'Automatic 10 Hours',     10, 10, 430.00, 43.00, 40.00,  'Flexible scheduling',       NULL,          false, 2, true, NOW(), NOW()),
        ('seed-pkg-intensive-20',    'seed-cat-intensive', 'intensive-20','Intensive 20 Hours',     20, 20, 760.00, 38.00, 140.00, 'Pass faster with focused blocks','Best Value',true, 1, true, NOW(), NOW()),
        ('seed-pkg-intensive-30',    'seed-cat-intensive', 'intensive-30','Intensive 30 Hours',     30, 30, 1110.00,37.00, 240.00, 'Ideal for beginners',       NULL,          false, 2, true, NOW(), NOW()),
        ('seed-pkg-theory',          'seed-cat-theory',    'theory-access','Theory Access',          1,  1,  29.99,  29.99, NULL,   'One-time payment',          NULL,          false, 1, true, NOW(), NOW()),
        ('seed-pkg-refresher-single','seed-cat-refresher', 'single',      'Single Refresher',       1,  1,  47.00,  47.00, NULL,   'Pay as you go',             NULL,          false, 1, true, NOW(), NOW()),
        ('seed-pkg-refresher-block5','seed-cat-refresher', 'block5',      'Refresher 5 Hours',      5,  5,  215.00, 43.00, 20.00,  'Get your confidence back',  'Popular',     true,  2, true, NOW(), NOW()),
        ('seed-pkg-pass-plus-std',   'seed-cat-pass-plus', 'standard',    'Pass Plus Standard',     6,  6,  210.00, 35.00, NULL,   'DVSA-recognised course',    'Recommended', true,  1, true, NOW(), NOW()),
        ('seed-pkg-motorway-single', 'seed-cat-motorway',  'single',      'Single Motorway',        1,  1,  50.00,  50.00, NULL,   'Pay as you go',             NULL,          false, 1, true, NOW(), NOW()),
        ('seed-pkg-motorway-block3', 'seed-cat-motorway',  'block3',      'Motorway 3 Hours',       3,  3,  138.00, 46.00, 12.00,  'Build confidence at speed', 'Popular',     true,  2, true, NOW(), NOW()),
        ('seed-pkg-mock-test-single','seed-cat-mock-test', 'single',      'Mock Test Session',      2,  1,  75.00,  37.50, NULL,   'Full test-route debrief',   NULL,          false, 1, true, NOW(), NOW()),
        ('seed-pkg-mock-test-x2',    'seed-cat-mock-test', 'two-pack',    'Mock Test × 2',          4,  2,  140.00, 35.00, 10.00,  'Two sessions + feedback',   'Best Value',  true,  2, true, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        "pricePerHour" = EXCLUDED."pricePerHour",
        savings = EXCLUDED.savings,
        "isPopular" = EXCLUDED."isPopular",
        "updatedAt" = NOW()
    `);
  }

  if (await tableExists('Coupon')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Coupon"
      (id, code, name, type, value, "maxDiscountAmount", "minOrderAmount", "startsAt", "endsAt", "maxRedemptions", "redemptionCount", "isActive", "createdAt", "updatedAt")
      VALUES
        ('seed-coupon-welcome', 'WELCOME10', 'Welcome Discount', 'PERCENT', 10.00, 50.00, 100.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '180 day', 1000, 45, true, NOW(), NOW()),
        ('seed-coupon-summer', 'SUMMER20', 'Summer Special', 'PERCENT', 20.00, 100.00, 200.00, NOW() - INTERVAL '7 day', NOW() + INTERVAL '60 day', 500, 128, true, NOW(), NOW()),
        ('seed-coupon-intensive', 'INTENSIVE15', 'Intensive Course Discount', 'PERCENT', 15.00, 150.00, 500.00, NOW(), NOW() + INTERVAL '90 day', 300, 0, true, NOW(), NOW()),
        ('seed-coupon-referral', 'REFER25', 'Referral Bonus', 'FIXED', 25.00, NULL, 0.00, NOW() - INTERVAL '30 day', NOW() + INTERVAL '365 day', 200, 67, true, NOW(), NOW()),
        ('seed-coupon-block-manual', 'MANUAL5', 'Manual Block Discount', 'FIXED', 15.00, NULL, 350.00, NOW(), NOW() + INTERVAL '120 day', 100, 23, true, NOW(), NOW()),
        ('seed-coupon-earlybird', 'EARLYBIRD30', 'Early Bird Special', 'PERCENT', 30.00, 200.00, 400.00, NOW(), NOW() + INTERVAL '14 day', 50, 12, true, NOW(), NOW()),
        ('seed-coupon-expired', 'OLDCODE10', 'Expired Coupon', 'PERCENT', 10.00, 40.00, 100.00, NOW() - INTERVAL '90 day', NOW() - INTERVAL '30 day', 100, 85, false, NOW() - INTERVAL '35 day', NOW())
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        value = EXCLUDED.value,
        "maxDiscountAmount" = EXCLUDED."maxDiscountAmount",
        "minOrderAmount" = EXCLUDED."minOrderAmount",
        "startsAt" = EXCLUDED."startsAt",
        "endsAt" = EXCLUDED."endsAt",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = NOW()
    `);
  }

  if (await tableExists('GiftVoucher')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "GiftVoucher"
      (id, code, amount, balance, "isRedeemed", "senderName", "recipientName", "recipientEmail", message, "stripePaymentId", "expiresAt", "createdAt")
      VALUES
        ('seed-gv-1', 'GIFT100', 100.00, 100.00, false, 'Alice Admin', 'Sam Student', 'sam.student@autopilot.demo', 'Happy driving! Good luck with your lessons.', NULL, NOW() + INTERVAL '365 day', NOW()),
        ('seed-gv-2', 'GIFT150', 150.00, 75.50, false, 'John Doe', 'Lisa Learner', 'lisa.learner@autopilot.demo', 'Best of luck - you''ve got this!', 'stripe_pi_111111', NOW() + INTERVAL '365 day', NOW() - INTERVAL '30 day'),
        ('seed-gv-3', 'GIFT200', 200.00, 0.00, true, 'Family Member', 'Tom Turner', 'tom.turner@autopilot.demo', 'Congratulations on learning to drive!', 'stripe_pi_222222', NOW() + INTERVAL '180 day', NOW() - INTERVAL '60 day'),
        ('seed-gv-4', 'GIFT50', 50.00, 50.00, false, 'Margaret Pink', 'Jessica James', 'jessica.james@autopilot.demo', 'A little gift to help with your lessons.', NULL, NOW() + INTERVAL '365 day', NOW() - INTERVAL '5 day')
      ON CONFLICT (code) DO UPDATE SET
        amount = EXCLUDED.amount,
        balance = EXCLUDED.balance,
        "isRedeemed" = EXCLUDED."isRedeemed",
        "expiresAt" = EXCLUDED."expiresAt"
    `);
  }

  if (await tableExists('Booking')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Booking"
      (id, reference, "studentId", "instructorId", "lessonType", transmission, "scheduledAt", "durationMins", status, "paymentStatus", "stripePaymentId", "totalAmount", "pricingPackageId", "voucherCode", "couponCode", "discountAmount", notes, "createdAt", "updatedAt")
      VALUES
        -- Confirmed bookings
        ('seed-booking-1', 'AP-000001', 'seed-student-1', 'seed-inst-1', 'MANUAL', 'manual', NOW() + INTERVAL '2 day', 120, 'CONFIRMED', 'PAID', NULL, 82.00, 'seed-pkg-manual-block10', NULL, 'WELCOME10', 8.00, 'First lesson confirmed', NOW(), NOW()),
        ('seed-booking-2', 'AP-000002', 'seed-student-2', 'seed-inst-2', 'AUTOMATIC', 'automatic', NOW() + INTERVAL '5 day', 60, 'CONFIRMED', 'PAID', NULL, 45.00, 'seed-pkg-auto-single', NULL, NULL, NULL, 'Single automatic lesson', NOW(), NOW()),
        -- Pending bookings (unpaid)
        ('seed-booking-3', 'AP-000003', 'seed-student-1', 'seed-inst-1', 'AUTOMATIC', 'automatic', NOW() + INTERVAL '7 day', 60, 'PENDING', 'UNPAID', NULL, 47.00, 'seed-pkg-auto-single', NULL, NULL, NULL, 'Awaiting payment', NOW(), NOW()),
        ('seed-booking-4', 'AP-000004', 'seed-student-3', 'seed-inst-3', 'INTENSIVE', 'manual', NOW() + INTERVAL '10 day', 540, 'PENDING', 'UNPAID', NULL, 760.00, 'seed-pkg-intensive-20', NULL, NULL, NULL, 'Intensive 20 hours - payment pending', NOW(), NOW()),
        -- Completed bookings
        ('seed-booking-5', 'AP-000005', 'seed-student-2', 'seed-inst-2', 'MANUAL', 'manual', NOW() - INTERVAL '3 day', 60, 'COMPLETED', 'PAID', 'stripe_pi_123456', 42.00, 'seed-pkg-manual-single', NULL, NULL, NULL, 'Lesson completed successfully', NOW() - INTERVAL '5 day', NOW() - INTERVAL '3 day'),
        ('seed-booking-6', 'AP-000006', 'seed-student-4', 'seed-inst-1', 'MANUAL', 'manual', NOW() - INTERVAL '1 day', 60, 'COMPLETED', 'PAID', NULL, 42.00, 'seed-pkg-manual-single', NULL, NULL, NULL, 'Great progress today!', NOW() - INTERVAL '3 day', NOW() - INTERVAL '1 day'),
        -- Cancelled bookings
        ('seed-booking-7', 'AP-000007', 'seed-student-3', 'seed-inst-2', 'THEORY', 'manual', NOW() + INTERVAL '15 day', 60, 'CANCELLED', 'REFUNDED', NULL, 29.99, 'seed-pkg-theory', NULL, NULL, NULL, 'Student cancelled due to illness', NOW() - INTERVAL '2 day', NOW() - INTERVAL '1 day')
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        "paymentStatus" = EXCLUDED."paymentStatus",
        "scheduledAt" = EXCLUDED."scheduledAt",
        "updatedAt" = NOW()
    `);
  }

  if (await tableExists('TheoryQuestion')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TheoryQuestion" (id, category, question, options, "correctIndex", explanation, "imageUrl")
      VALUES
        ('seed-theory-1', 'Road Signs', 'What does a red circle road sign usually indicate?', '["Prohibition or mandatory instruction","Warning","Tourist information","Motorway ahead"]'::jsonb, 0, 'Red circles with a white background indicate prohibitions. A red circle with a blue background indicates a mandatory instruction.', NULL),
        ('seed-theory-2', 'Hazard Awareness', 'When should you use mirrors?', '["Only before turning","Only at junctions","Regularly throughout driving","Never while moving"]'::jsonb, 2, 'Mirror checks should be frequent and planned. A safe driver looks in mirrors every 5-10 seconds.', NULL),
        ('seed-theory-3', 'Speed Limits', 'What is the national speed limit for cars on a single carriageway road?', '["40 mph","50 mph","60 mph","70 mph"]'::jsonb, 2, 'The national speed limit for cars on a single carriageway is 60 mph unless otherwise indicated.', NULL),
        ('seed-theory-4', 'Following Distances', 'What is the minimum stopping distance at 50 mph on a dry road?', '["38 metres","53 metres","73 metres","96 metres"]'::jsonb, 2, 'At 50 mph, the stopping distance is 53 metres (3 seconds rule applies).', NULL),
        ('seed-theory-5', 'Traffic Lights', 'What should you do when traffic lights turn amber?', '["Speed up to cross","Prepare to stop","Stop immediately","Ignore and continue"]'::jsonb, 1, 'When lights turn amber, you should prepare to stop unless you are too close to do so safely.', NULL),
        ('seed-theory-6', 'Parking', 'Where is it illegal to park?', '["On the pavement","Near a junction","In a disabled bay without permit","All of the above"]'::jsonb, 3, 'It is illegal to park on pavements, near junctions, or in disabled bays without a valid permit.', NULL),
        ('seed-theory-7', 'Pedestrians', 'What should you do if you see a pedestrian crossing ahead?', '["Slow down and be prepared to stop","Maintain your speed","Speed up to pass first","Sound horn"]'::jsonb, 0, 'You should always slow down and be prepared to stop for pedestrians at crossings.', NULL),
        ('seed-theory-8', 'Road Conditions', 'In wet weather, how should you increase your following distance?', '["Double it","Triple it","Maintain the same distance","No distance needed"]'::jsonb, 0, 'In wet weather, you should double your normal following distance as wet roads reduce grip.', NULL),
        ('seed-theory-9', 'Motorways', 'What is the minimum speed limit on a motorway for cars?', '["No minimum","30 mph","40 mph","50 mph"]'::jsonb, 0, 'There is no official minimum speed limit on a motorway, but you should be able to maintain a reasonable speed.', NULL),
        ('seed-theory-10', 'Hazards', 'What should you do if you see a hazard ahead?', '["Honk your horn","Flash your headlights","Slow down and assess","Speed up"]'::jsonb, 2, 'You should slow down and fully assess the hazard to decide the appropriate action.', NULL),
        ('seed-theory-11', 'Motorcyclists', 'Why should you give extra space to motorcyclists?', '["They need more road space","They are harder to see and can be unstable","They have priority","No extra space needed"]'::jsonb, 1, 'Motorcyclists are harder to spot and more vulnerable. They can also become unstable if you pass too close.', NULL),
        ('seed-theory-12', 'Tiredness', 'What is the best way to stay alert when driving?', '["Take regular breaks","Drink coffee","Drive faster","Ignore fatigue"]'::jsonb, 0, 'Taking regular breaks is the best way to combat driver fatigue. A 15-minute break every 2 hours is recommended.', NULL),
        ('seed-theory-13', 'Fog', 'What should you do in dense fog?', '["Use full beam headlights","Use dipped beam and fog lights","Slow down","All of the above except A"]'::jsonb, 3, 'Use dipped beam and fog lights, and slow down significantly. Full beam reflects off fog and reduces visibility.', NULL),
        ('seed-theory-14', 'Braking', 'What should you do if your brakes fail?', '["Use the handbrake gradually","Sound the horn","Flash headlights","Press the brake pedal harder"]'::jsonb, 0, 'If brakes fail, use the handbrake gradually while sounding the horn to alert other users.', NULL),
        ('seed-theory-15', 'Accidents', 'What should you do at the scene of an accident?', '["Call emergency services","Move casualty if trained","Gather witness details","All of the above"]'::jsonb, 3, 'Call emergency services, help casualties if trained, and gather witness information for reports.', NULL)
      ON CONFLICT (id) DO UPDATE SET
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        "correctIndex" = EXCLUDED."correctIndex",
        explanation = EXCLUDED.explanation
    `);
  }

  if (await tableExists('StudentTheoryProgress')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "StudentTheoryProgress" (id, "studentId", "questionId", "isCorrect", "attemptedAt")
      VALUES
        -- Sam Student (seed-student-1) progress
        ('seed-progress-1-1', 'seed-student-1', 'seed-theory-1', true, NOW() - INTERVAL '5 day'),
        ('seed-progress-1-2', 'seed-student-1', 'seed-theory-2', true, NOW() - INTERVAL '5 day'),
        ('seed-progress-1-3', 'seed-student-1', 'seed-theory-3', false, NOW() - INTERVAL '4 day'),
        ('seed-progress-1-4', 'seed-student-1', 'seed-theory-4', true, NOW() - INTERVAL '4 day'),
        ('seed-progress-1-5', 'seed-student-1', 'seed-theory-5', true, NOW() - INTERVAL '3 day'),
        -- Lisa Learner (seed-student-2) progress
        ('seed-progress-2-1', 'seed-student-2', 'seed-theory-1', true, NOW() - INTERVAL '3 day'),
        ('seed-progress-2-2', 'seed-student-2', 'seed-theory-2', false, NOW() - INTERVAL '2 day'),
        ('seed-progress-2-3', 'seed-student-2', 'seed-theory-3', true, NOW() - INTERVAL '2 day'),
        ('seed-progress-2-4', 'seed-student-2', 'seed-theory-6', true, NOW() - INTERVAL '1 day'),
        -- Tom Turner (seed-student-3) progress
        ('seed-progress-3-1', 'seed-student-3', 'seed-theory-1', true, NOW() - INTERVAL '6 day'),
        ('seed-progress-3-2', 'seed-student-3', 'seed-theory-2', true, NOW() - INTERVAL '6 day'),
        ('seed-progress-3-3', 'seed-student-3', 'seed-theory-5', false, NOW() - INTERVAL '5 day'),
        ('seed-progress-3-4', 'seed-student-3', 'seed-theory-7', true, NOW() - INTERVAL '4 day'),
        ('seed-progress-3-5', 'seed-student-3', 'seed-theory-8', true, NOW() - INTERVAL '3 day'),
        ('seed-progress-3-6', 'seed-student-3', 'seed-theory-9', false, NOW() - INTERVAL '2 day'),
        -- Jessica James (seed-student-4) progress
        ('seed-progress-4-1', 'seed-student-4', 'seed-theory-1', true, NOW() - INTERVAL '2 day'),
        ('seed-progress-4-2', 'seed-student-4', 'seed-theory-4', true, NOW() - INTERVAL '2 day'),
        ('seed-progress-4-3', 'seed-student-4', 'seed-theory-11', true, NOW() - INTERVAL '1 day'),
        ('seed-progress-4-4', 'seed-student-4', 'seed-theory-12', true, NOW() - INTERVAL '1 day')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('ContactSubmission')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ContactSubmission" (id, name, phone, postcode, "enquiryType", "callTime", message, "createdAt")
      VALUES
        ('seed-contact-1', 'John Doe', '07700111222', 'SL1 1AA', 'Lesson enquiry', 'Evening', 'Looking to start manual lessons next week.', NOW() - INTERVAL '2 day'),
        ('seed-contact-2', 'Sarah Smith', '07700222333', 'RG1 3BB', 'Gift voucher', 'Any time', 'Would like to purchase a gift voucher for my son.', NOW() - INTERVAL '1 day'),
        ('seed-contact-3', 'Mike Johnson', '07700444555', 'SL4 1AA', 'Instructor enquiry', 'Afternoon', 'Interested in male instructor for intensive course.', NOW() - INTERVAL '5 hour'),
        ('seed-contact-4', 'Emma Wilson', '07700555666', 'SL2 2AA', 'Lesson enquiry', 'Morning', 'Need manual lessons, female instructor preferred.', NOW() - INTERVAL '12 hour'),
        ('seed-contact-5', 'Robert Brown', '07700666777', 'RG2 4AA', 'General enquiry', 'Evening', 'What areas do you cover?', NOW() - INTERVAL '1 hour')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('InstructorApplication')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "InstructorApplication"
      (id, "fullName", email, phone, postcode, "hasFullLicence", "yearsExperience", "trainingStarted", message, status, "createdAt")
      VALUES
        ('seed-app-1', 'Nora Trainer', 'nora.trainer@autopilot.demo', '07700333444', 'RG1 2BB', true, '5+', true, 'Interested in joining as a part-time instructor. Available weekends.', 'pending', NOW() - INTERVAL '3 day'),
        ('seed-app-2', 'Mark Peterson', 'mark.peterson@email.com', '07700444555', 'SL1 4AA', true, '3+', true, 'Former ADI, looking to return to instruction. Flexible hours.', 'pending', NOW() - INTERVAL '1 day'),
        ('seed-app-3', 'Caroline Hughes', 'caroline.hughes@email.com', '07700555666', 'RG4 5BB', true, '7+', true, 'Specialist in nervous learners and intensive training.', 'approved', NOW() - INTERVAL '20 day'),
        ('seed-app-4', 'Patrick O''Brien', 'patrick.obrien@email.com', '07700666777', 'SL5 2AA', false, '1+', false, 'Currently training to become an ADI. Hoping to join next year.', 'pending', NOW() - INTERVAL '5 day')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('Setting')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Setting" (key, value, "updatedAt")
      VALUES
        ('stripe_secret_key', 'sk_test_demo_seed_key', NOW()),
        ('stripe_publishable_key', 'pk_test_demo_seed_key', NOW()),
        ('stripe_webhook_secret', 'whsec_demo_seed_key', NOW()),
        ('smtp_host', 'smtp.mailtrap.io', NOW()),
        ('smtp_port', '2525', NOW()),
        ('smtp_user', 'demo_user', NOW()),
        ('smtp_pass', 'demo_pass', NOW()),
        ('email_from', 'noreply@autopilot.demo', NOW()),
        ('email_admin', 'admin@autopilot.demo', NOW())
      ON CONFLICT (key) DO NOTHING
    `);
  }
}

async function seedProductionAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@autopilotdrivingschool.co.uk';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      password: passwordHash,
      isEmailVerified: true,
      country: 'UK',
      city: 'Slough',
    },
  });
  console.log(`✅ Production admin seeded: ${email}`);
}

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';

  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (isProduction) {
    if (existing) {
      console.log('✅ Admin already exists — skipping production seed.');
      return;
    }
    await ensureDrivingSchoolSchema();
    await seedProductionAdmin();
    return;
  }

  if (existing) {
    console.log('✅ Admin user already exists — skipping seed.');
    return;
  }
  console.log('🌱 Seeding demo data...');
  await ensureDrivingSchoolSchema();
  await seedAuthCore();
  await seedDrivingSchoolTables();
  console.log('✅ Demo seed completed.');
}

main()
  .catch((err) => {
    console.error('❌ Demo seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

