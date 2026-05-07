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
}

async function seedDrivingSchoolTables() {
  const hasUserTable = await tableExists('User');
  if (!hasUserTable) {
    console.warn('Skipping driving-school seed: "User" table not found.');
    return;
  }

  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "User" (id, name, email, phone, "passwordHash", role, "createdAt", "updatedAt")
     VALUES
       ('seed-admin', 'Alice Admin', 'alice.admin@autopilot.demo', '07700900001', $1, 'ADMIN', NOW(), NOW()),
       ('seed-instructor', 'Ian Instructor', 'ian.instructor@autopilot.demo', '07700900002', $1, 'INSTRUCTOR', NOW(), NOW()),
       ('seed-student', 'Sam Student', 'sam.student@autopilot.demo', '07700900003', $1, 'STUDENT', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       phone = EXCLUDED.phone,
       "passwordHash" = EXCLUDED."passwordHash",
       role = EXCLUDED.role,
       "updatedAt" = NOW()`,
    passwordHash
  );

  if (await tableExists('Area')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Area" (id, name, "postcodePrefix", description, "isActive")
      VALUES
        ('seed-area-sl1', 'Slough', 'SL1', 'Central Slough coverage', true),
        ('seed-area-rg1', 'Reading', 'RG1', 'Reading town centre and nearby', true),
        ('seed-area-sl4', 'Windsor', 'SL4', 'Windsor and Eton coverage', true)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        "postcodePrefix" = EXCLUDED."postcodePrefix",
        description = EXCLUDED.description,
        "isActive" = EXCLUDED."isActive"
    `);
  }

  if (await tableExists('Instructor')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Instructor"
      (id, "userId", bio, "photoUrl", rating, "reviewCount", "yearsExp", transmission, areas, "pricePerHour", "isFemale", "isActive", "licenceNumber", "createdAt")
      VALUES
      ('seed-inst-1', 'seed-instructor', 'DVSA-approved instructor with 8 years experience.', NULL, 4.9, 128, 8, ARRAY['manual','automatic'], ARRAY['SL1','RG1','SL4'], 42.00, false, true, 'LIC-AP-001', NOW())
      ON CONFLICT ("userId") DO UPDATE SET
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
        ('seed-av-1', 'seed-inst-1', 1, '09:00', '17:00', true),
        ('seed-av-2', 'seed-inst-1', 2, '09:00', '17:00', true),
        ('seed-av-3', 'seed-inst-1', 3, '09:00', '17:00', true),
        ('seed-av-4', 'seed-inst-1', 4, '09:00', '17:00', true),
        ('seed-av-5', 'seed-inst-1', 5, '09:00', '17:00', true)
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('LessonPricingCategory')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "LessonPricingCategory" (id, "lessonType", slug, "displayName", description, "sortOrder", "isActive", "createdAt", "updatedAt")
      VALUES
        ('seed-cat-manual', 'MANUAL', 'manual', 'Manual Driving Lessons', 'Learn with manual transmission', 1, true, NOW(), NOW()),
        ('seed-cat-auto', 'AUTOMATIC', 'automatic', 'Automatic Driving Lessons', 'Learn with automatic transmission', 2, true, NOW(), NOW()),
        ('seed-cat-intensive', 'INTENSIVE', 'intensive', 'Intensive Courses', 'Fast-track intensive course options', 3, true, NOW(), NOW()),
        ('seed-cat-theory', 'THEORY', 'theory', 'Theory Training', 'DVSA theory prep package', 4, true, NOW(), NOW())
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
        ('seed-pkg-manual-single', 'seed-cat-manual', 'single', 'Single Manual Lesson', 1, 1, 45.00, 45.00, NULL, 'Pay as you go', NULL, false, 1, true, NOW(), NOW()),
        ('seed-pkg-manual-block10', 'seed-cat-manual', 'block10', 'Manual 10 Hours', 10, 10, 410.00, 41.00, 40.00, 'Best for new starters', 'Popular', true, 2, true, NOW(), NOW()),
        ('seed-pkg-auto-single', 'seed-cat-auto', 'single', 'Single Automatic Lesson', 1, 1, 47.00, 47.00, NULL, 'Pay as you go', NULL, false, 1, true, NOW(), NOW()),
        ('seed-pkg-auto-block10', 'seed-cat-auto', 'block10', 'Automatic 10 Hours', 10, 10, 430.00, 43.00, 40.00, 'Flexible scheduling', NULL, false, 2, true, NOW(), NOW()),
        ('seed-pkg-intensive-20', 'seed-cat-intensive', 'intensive-20', 'Intensive 20 Hours', 20, 20, 760.00, 38.00, 140.00, 'Pass faster with focused blocks', 'Best Value', true, 1, true, NOW(), NOW()),
        ('seed-pkg-intensive-30', 'seed-cat-intensive', 'intensive-30', 'Intensive 30 Hours', 30, 30, 1110.00, 37.00, 240.00, 'Ideal for beginners', NULL, false, 2, true, NOW(), NOW()),
        ('seed-pkg-theory', 'seed-cat-theory', 'theory-access', 'Theory Access', 1, 1, 29.99, 29.99, NULL, 'One-time payment', NULL, false, 1, true, NOW(), NOW())
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
        ('seed-coupon-welcome', 'WELCOME10', 'Welcome Discount', 'PERCENT', 10.00, 40.00, 80.00, NOW() - INTERVAL '1 day', NOW() + INTERVAL '180 day', 1000, 0, true, NOW(), NOW())
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        value = EXCLUDED.value,
        "maxDiscountAmount" = EXCLUDED."maxDiscountAmount",
        "minOrderAmount" = EXCLUDED."minOrderAmount",
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
        ('seed-gv-1', 'GIFT100', 100.00, 100.00, false, 'Alice Admin', 'Sam Student', 'sam.student@autopilot.demo', 'Happy driving!', NULL, NOW() + INTERVAL '365 day', NOW())
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
        ('seed-booking-1', 'AP-000001', 'seed-student', 'seed-inst-1', 'MANUAL', 'manual', NOW() + INTERVAL '2 day', 120, 'CONFIRMED', 'PAID', NULL, 82.00, 'seed-pkg-manual-block10', NULL, 'WELCOME10', 8.00, 'Seeded confirmed booking', NOW(), NOW()),
        ('seed-booking-2', 'AP-000002', 'seed-student', 'seed-inst-1', 'AUTOMATIC', 'automatic', NOW() + INTERVAL '7 day', 60, 'PENDING', 'UNPAID', NULL, 47.00, 'seed-pkg-auto-single', NULL, NULL, NULL, 'Seeded pending booking', NOW(), NOW())
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
        ('seed-theory-1', 'Road Signs', 'What does a red circle road sign usually indicate?', '["Mandatory instruction","Warning","Tourist information","Motorway"]'::jsonb, 0, 'Red circles usually show prohibitions or mandatory instructions.', NULL),
        ('seed-theory-2', 'Hazard Awareness', 'When should you use mirrors?', '["Only before turning","Only at junctions","Regularly throughout driving","Never while moving"]'::jsonb, 2, 'Mirror checks should be frequent and planned.', NULL)
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
        ('seed-progress-1', 'seed-student', 'seed-theory-1', true, NOW() - INTERVAL '1 day'),
        ('seed-progress-2', 'seed-student', 'seed-theory-2', false, NOW() - INTERVAL '12 hours')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('ContactSubmission')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "ContactSubmission" (id, name, phone, postcode, "enquiryType", "callTime", message, "createdAt")
      VALUES
        ('seed-contact-1', 'John Doe', '07700111222', 'SL1 1AA', 'Lesson enquiry', 'Evening', 'Looking to start manual lessons next week.', NOW() - INTERVAL '2 day')
      ON CONFLICT (id) DO NOTHING
    `);
  }

  if (await tableExists('InstructorApplication')) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "InstructorApplication"
      (id, "fullName", email, phone, postcode, "hasFullLicence", "yearsExperience", "trainingStarted", message, status, "createdAt")
      VALUES
        ('seed-app-1', 'Nora Trainer', 'nora.trainer@autopilot.demo', '07700333444', 'RG1 2BB', true, '5+', true, 'Interested in joining as a part-time instructor.', 'pending', NOW() - INTERVAL '3 day')
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
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        "updatedAt" = NOW()
    `);
  }
}

async function main() {
  console.log('🌱 Seeding demo data...');
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

