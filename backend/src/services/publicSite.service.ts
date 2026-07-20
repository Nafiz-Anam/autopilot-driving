import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import prisma from '../client';
import emailService from './email.service';
import settingsService, { SETTING_KEYS } from './settings.service';
import config from '../config/config';

class PublicSiteError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const applySchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Phone required'),
  postcode: z.string().min(3, 'Postcode required'),
  hasFullLicence: z.boolean(),
  yearsExperience: z.enum(['3-5', '6-10', '10+']),
  trainingStarted: z.boolean().default(false),
  applicantType: z.enum(['already_instructor', 'want_to_become']).default('want_to_become'),
  message: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^(\+44|0)[\d\s]{9,12}$/, 'Enter a valid UK phone number'),
  postcode: z.string().min(3, 'Postcode required').optional(),
  enquiryType: z.enum([
    'manual_lessons',
    'automatic_lessons',
    'intensive_course',
    'refresher',
    'become_instructor',
    'callback_request',
    'other',
  ]),
  callTime: z.string().optional(),
  message: z.string().min(5, 'Please tell us a bit more').max(1000),
});

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name required'),
    email: z.string().email('Valid email required'),
    phone: z.string().regex(/^(\+44|0)7\d{9}$/, 'Enter a valid UK mobile number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'INSTRUCTOR']).default('STUDENT'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type InstructorRow = {
  id: string;
  userId: string;
  bio: string | null;
  photoUrl: string | null;
  rating: string;
  reviewCount: number;
  yearsExp: number;
  transmission: string[];
  areas: string[];
  pricePerHour: string;
  isFemale: boolean;
  isActive: boolean;
  userName: string;
  userImage: string | null;
};

type TheoryQuestionRow = {
  id: string;
  category: string;
  question: string;
  options: unknown;
  explanation: string | null;
  imageUrl: string | null;
};

type TheoryAttemptRow = {
  questionId: string;
  isCorrect: boolean;
  attemptedAt: Date;
};

type UserRoleRow = {
  id: string;
  role: string;
};

type RegisterUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const contactRateLimitMap = new Map<string, { count: number; resetAt: number }>();

const getPostcodePrefix = (postcode: string): string => {
  const cleaned = postcode.toUpperCase().replace(/\s/g, '');
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2})/);
  return match ? match[1] : cleaned.slice(0, 3);
};

const isContactRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const entry = contactRateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    contactRateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }

  if (entry.count >= 3) {
    return true;
  }

  entry.count += 1;
  return false;
};

const notifyAdmin = async (subject: string, details: Record<string, string>): Promise<void> => {
  try {
    await emailService.sendAdminNotificationEmail(subject, details);
  } catch (error) {
    // Keep this non-blocking to mirror frontend behavior.
    console.error('[public-site] admin notification error:', error);
  }
};

const getAreaCoverage = async (postcode: string) => {
  const normalizedPostcode = String(postcode || '').trim();
  if (!normalizedPostcode) {
    throw new PublicSiteError(400, 'postcode query param required');
  }

  const prefix = getPostcodePrefix(normalizedPostcode);
  const matchPrefix = prefix.slice(0, 3);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      postcodePrefix: string;
      description: string | null;
      latitude: number | null;
      longitude: number | null;
    }>
  >(
    `SELECT id, name, "postcodePrefix", description, latitude, longitude
     FROM "Area"
     WHERE "postcodePrefix" LIKE $1 || '%'
       AND "isActive" = true
     LIMIT 1`,
    matchPrefix
  );

  const area = rows[0];
  if (!area) {
    return { covered: false };
  }

  return {
    covered: true,
    area: {
      id: area.id,
      name: area.name,
      postcodePrefix: area.postcodePrefix,
      description: area.description,
      latitude: area.latitude,
      longitude: area.longitude,
    },
  };
};

const listActiveAreas = async () => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string;
      postcodePrefix: string;
      description: string | null;
      latitude: number | null;
      longitude: number | null;
    }>
  >(
    `SELECT id, name, "postcodePrefix", description, latitude, longitude
     FROM "Area"
     WHERE "isActive" = true
     ORDER BY name ASC`
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    postcodePrefix: row.postcodePrefix,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
  }));
};

const listInstructors = async (filters: {
  postcode?: string;
  transmission?: string;
  female?: string;
}) => {
  const conditions = ['i."isActive" = true'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters.female === 'true') {
    conditions.push('i."isFemale" = true');
  }

  if (filters.postcode) {
    const prefix = getPostcodePrefix(filters.postcode);
    const postcodeFilter = [prefix, prefix.slice(0, 2)];
    conditions.push(`i.areas && $${paramIndex}::text[]`);
    values.push(postcodeFilter);
    paramIndex += 1;
  }

  if (filters.transmission) {
    conditions.push(
      `EXISTS (
        SELECT 1
        FROM unnest(i.transmission) AS t(value)
        WHERE LOWER(t.value) = LOWER($${paramIndex})
      )`
    );
    values.push(filters.transmission);
  }

  const rows = await prisma.$queryRawUnsafe<InstructorRow[]>(
    `SELECT
       i.id,
       i."userId",
       i.bio,
       i."photoUrl",
       i.rating::text AS rating,
       i."reviewCount",
       i."yearsExp",
       i.transmission,
       i.areas,
       i."pricePerHour"::text AS "pricePerHour",
       i."isFemale",
       i."isActive",
       u.name AS "userName",
       u."profilePicture" AS "userImage"
     FROM "Instructor" i
     INNER JOIN users u ON u.id = i."userId"
     WHERE ${conditions.join(' AND ')}
     ORDER BY i.rating DESC`,
    ...values
  );

  return rows.map(row => ({
    id: row.id,
    userId: row.userId,
    bio: row.bio,
    photoUrl: row.photoUrl,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    yearsExp: row.yearsExp,
    transmission: row.transmission,
    areas: row.areas,
    pricePerHour: Number(row.pricePerHour),
    isFemale: row.isFemale,
    isActive: row.isActive,
    user: {
      name: row.userName,
      image: row.userImage,
    },
  }));
};

const createInstructorApplication = async (payload: unknown) => {
  const parsed = applySchema.safeParse(payload);
  if (!parsed.success) {
    throw new PublicSiteError(400, 'Invalid input', parsed.error.flatten());
  }

  const {
    fullName,
    email,
    phone,
    postcode,
    hasFullLicence,
    yearsExperience,
    trainingStarted,
    applicantType,
    message,
  } = parsed.data;

  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "InstructorApplication" (
      id, "fullName", email, phone, postcode, "hasFullLicence", "yearsExperience", "trainingStarted", "applicantType", message, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending'
    )
    RETURNING id`,
    id,
    fullName,
    email,
    phone,
    postcode,
    hasFullLicence,
    yearsExperience,
    trainingStarted,
    applicantType,
    message ?? null
  );

  void notifyAdmin(`New Instructor Application — ${fullName}`, {
    Name: fullName,
    Email: email,
    Phone: phone,
    Postcode: postcode,
    'Full Licence': hasFullLicence ? 'Yes' : 'No',
    Experience: `${yearsExperience} years`,
    'Training Started': trainingStarted ? 'Yes' : 'No',
    Type:
      applicantType === 'already_instructor'
        ? 'Already a qualified ADI'
        : 'Wants to become an instructor',
    Message: message ?? 'none',
  });

  // Acknowledge receipt to applicant (fire-and-forget)
  emailService
    .sendInstructorApplicationReceivedEmail({ to: email, applicantName: fullName, email })
    .catch(() => {});

  return { id: rows[0]?.id };
};

const createContactSubmission = async (payload: unknown, ip: string) => {
  if (isContactRateLimited(ip)) {
    throw new PublicSiteError(429, 'Too many requests. Please try again later.');
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PublicSiteError(400, 'Invalid input', parsed.error.flatten());
  }

  const { name, email, phone, postcode, enquiryType, callTime, message } = parsed.data;

  // Add email column if it doesn't exist yet (migration-free approach)
  await prisma
    .$executeRawUnsafe(`ALTER TABLE "ContactSubmission" ADD COLUMN IF NOT EXISTS email TEXT`)
    .catch(() => {});

  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "ContactSubmission" (id, name, email, phone, postcode, "enquiryType", "callTime", message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    id,
    name,
    email,
    phone,
    postcode ?? null,
    enquiryType,
    callTime ?? null,
    message
  );

  void notifyAdmin(`New Contact Form Submission — ${enquiryType}`, {
    Name: name,
    Email: email,
    Phone: phone,
    Postcode: postcode ?? '—',
    Enquiry: enquiryType,
    'Best time': callTime ?? 'any',
    Message: message,
  });

  // Acknowledge receipt to submitter
  emailService.sendContactAcknowledgementEmail({ to: email, name }).catch(() => {});

  return { id: rows[0]?.id };
};

const registerUser = async (payload: unknown) => {
  const parsed = registerSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PublicSiteError(400, 'Invalid input', parsed.error.flatten());
  }

  const { name, email, phone, password, role } = parsed.data;

  const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    email
  );
  if (existing[0]) {
    throw new PublicSiteError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const id = randomUUID();
    const users = await prisma.$queryRawUnsafe<RegisterUserRow[]>(
      `INSERT INTO users (id, name, email, phone, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, name, role`,
      id,
      name,
      email,
      phone,
      passwordHash,
      'USER'
    );

    const user = users[0];

    if (role === 'INSTRUCTOR') {
      await prisma.instructor.create({
        data: { id, userId: id },
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: role,
    };
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new PublicSiteError(409, 'Email already registered');
    }
    throw error;
  }
};

const getTheoryQuestions = async (
  userId: string,
  query: { page?: string; limit?: string; category?: string | null }
) => {
  const users = await prisma.$queryRawUnsafe<UserRoleRow[]>(
    `SELECT id, role::text AS role FROM users WHERE id = $1 LIMIT 1`,
    userId
  );
  const user = users[0];
  if (!user) {
    throw new PublicSiteError(401, 'Unauthorised');
  }
  if (user.role !== 'USER' && user.role !== 'ADMIN') {
    throw new PublicSiteError(403, 'Forbidden');
  }

  const pageParsed = Number.parseInt(query.page ?? '1', 10);
  const limitParsed = Number.parseInt(query.limit ?? '20', 10);
  const page = Number.isNaN(pageParsed) ? 1 : Math.max(1, pageParsed);
  const limit = Number.isNaN(limitParsed) ? 20 : Math.min(50, Math.max(1, limitParsed));
  const category = query.category ?? undefined;
  const skip = (page - 1) * limit;

  const questions = category
    ? await prisma.$queryRawUnsafe<TheoryQuestionRow[]>(
        `SELECT id, category, question, options, explanation, "imageUrl"
         FROM "TheoryQuestion"
         WHERE category = $1
         ORDER BY id ASC
         OFFSET $2
         LIMIT $3`,
        category,
        skip,
        limit
      )
    : await prisma.$queryRawUnsafe<TheoryQuestionRow[]>(
        `SELECT id, category, question, options, explanation, "imageUrl"
         FROM "TheoryQuestion"
         ORDER BY id ASC
         OFFSET $1
         LIMIT $2`,
        skip,
        limit
      );

  const totalRows = category
    ? await prisma.$queryRawUnsafe<Array<{ total: string }>>(
        `SELECT COUNT(*)::text AS total FROM "TheoryQuestion" WHERE category = $1`,
        category
      )
    : await prisma.$queryRawUnsafe<Array<{ total: string }>>(
        `SELECT COUNT(*)::text AS total FROM "TheoryQuestion"`
      );

  const questionIds = questions.map(question => question.id);
  const attempts =
    questionIds.length > 0
      ? await prisma.$queryRawUnsafe<TheoryAttemptRow[]>(
          `SELECT DISTINCT ON ("questionId")
             "questionId",
             "isCorrect",
             "attemptedAt"
           FROM "StudentTheoryProgress"
           WHERE "studentId" = $1
             AND "questionId" = ANY($2::text[])
           ORDER BY "questionId", "attemptedAt" DESC`,
          user.id,
          questionIds
        )
      : [];

  const attemptsByQuestionId = new Map(attempts.map(attempt => [attempt.questionId, attempt]));
  const total = Number(totalRows[0]?.total ?? 0);

  return {
    questions: questions.map(question => ({
      id: question.id,
      category: question.category,
      question: question.question,
      options: question.options,
      explanation: question.explanation,
      imageUrl: question.imageUrl,
      lastAttempt: attemptsByQuestionId.get(question.id)
        ? {
            isCorrect: attemptsByQuestionId.get(question.id)!.isCorrect,
            attemptedAt: attemptsByQuestionId.get(question.id)!.attemptedAt,
          }
        : null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

interface GoogleReview {
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime: string;
}

interface ReviewsCache {
  data: { reviews: GoogleReview[]; rating: number; totalReviews: number };
  cachedAt: number;
}

const REVIEWS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let reviewsCache: ReviewsCache | null = null;

// TODO: endpoint is blocked until a valid GOOGLE_PLACE_ID is configured — frontend is using static demo reviews for now
const getGoogleReviews = async (): Promise<{
  reviews: GoogleReview[];
  rating: number;
  totalReviews: number;
}> => {
  const apiKey = config.google.placesApiKey;
  const placeId = config.google.placeId;

  if (!apiKey || !placeId) {
    throw new PublicSiteError(503, 'Google Places API not configured');
  }

  const now = Date.now();
  if (reviewsCache && now - reviewsCache.cachedAt < REVIEWS_CACHE_TTL_MS) {
    return reviewsCache.data;
  }

  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const response = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'reviews,rating,userRatingCount',
    },
  });

  if (!response.ok) {
    throw new PublicSiteError(502, 'Failed to fetch Google reviews');
  }

  const json = (await response.json()) as {
    rating?: number;
    userRatingCount?: number;
    reviews?: Array<{
      rating: number;
      relativePublishTimeDescription: string;
      text?: { text: string };
      authorAttribution?: { displayName: string; photoUri?: string };
      publishTime?: string;
    }>;
  };

  const reviews: GoogleReview[] = (json.reviews ?? [])
    .filter(r => r.text?.text)
    .map(r => ({
      authorName: r.authorAttribution?.displayName ?? 'Student',
      authorPhotoUrl: r.authorAttribution?.photoUri ?? null,
      rating: r.rating,
      text: r.text!.text,
      relativeTime: r.relativePublishTimeDescription,
      publishTime: r.publishTime ?? '',
    }));

  const result = {
    reviews,
    rating: json.rating ?? 5,
    totalReviews: json.userRatingCount ?? 0,
  };

  reviewsCache = { data: result, cachedAt: now };
  return result;
};

const getPricingCategories = async () => {
  const categories = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "lessonType"::text AS "lessonType", slug, "displayName", description, "sortOrder", "isActive"
     FROM "LessonPricingCategory"
     WHERE "isActive" = true
     ORDER BY "sortOrder" ASC`
  );
  const packages = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, "categoryId", slug, name, hours, lessons,
            price::text AS price, "pricePerHour"::text AS "pricePerHour",
            savings::text AS savings, "footerNote", badge, "isPopular", "sortOrder", "isActive"
     FROM "LessonPricingPackage"
     WHERE "isActive" = true
     ORDER BY price ASC`
  );

  const data = categories.map(c => ({
    id: c.id,
    lessonType: c.lessonType,
    slug: c.slug,
    displayName: c.displayName,
    description: c.description,
    sortOrder: c.sortOrder,
    packages: packages
      .filter(p => p.categoryId === c.id)
      .map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        slug: p.slug,
        name: p.name,
        hours: p.hours,
        lessons: p.lessons,
        price: parseFloat(p.price),
        pricePerHour: p.pricePerHour ? parseFloat(p.pricePerHour) : null,
        savings: p.savings ? parseFloat(p.savings) : null,
        footerNote: p.footerNote,
        badge: p.badge,
        isPopular: p.isPopular,
      })),
  }));

  return data;
};

export default {
  PublicSiteError,
  getPricingCategories,
  getAreaCoverage,
  listActiveAreas,
  listInstructors,
  createInstructorApplication,
  createContactSubmission,
  registerUser,
  getTheoryQuestions,
  getGoogleReviews,
};
