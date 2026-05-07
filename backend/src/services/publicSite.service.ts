import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../client';
import emailService from './email.service';
import settingsService, { SETTING_KEYS } from './settings.service';

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
  message: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().regex(/^(\+44|0)7\d{9}$/, 'Enter a valid UK mobile number'),
  postcode: z.string().min(3, 'Postcode required'),
  enquiryType: z.enum([
    'manual_lessons',
    'automatic_lessons',
    'intensive_course',
    'refresher',
    'become_instructor',
    'other',
  ]),
  callTime: z.string().optional(),
  message: z.string().optional(),
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
    }>
  >(
    `SELECT id, name, "postcodePrefix", description
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
    },
  };
};

const listInstructors = async (filters: { postcode?: string; transmission?: string; female?: string }) => {
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
    paramIndex += 1;
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
    message,
  } = parsed.data;

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "InstructorApplication" (
      "fullName", email, phone, postcode, "hasFullLicence", "yearsExperience", "trainingStarted", message, status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, 'pending'
    )
    RETURNING id`,
    fullName,
    email,
    phone,
    postcode,
    hasFullLicence,
    yearsExperience,
    trainingStarted,
    message ?? null
  );

  void notifyAdmin(
    `New Instructor Application — ${fullName}`,
    {
      Name: fullName,
      Email: email,
      Phone: phone,
      Postcode: postcode,
      'Full Licence': hasFullLicence ? 'Yes' : 'No',
      Experience: `${yearsExperience} years`,
      'Training Started': trainingStarted ? 'Yes' : 'No',
      Message: message ?? 'none',
    }
  );

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

  const { name, phone, postcode, enquiryType, callTime, message } = parsed.data;

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `INSERT INTO "ContactSubmission" (name, phone, postcode, "enquiryType", "callTime", message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    name,
    phone,
    postcode,
    enquiryType,
    callTime ?? null,
    message ?? null
  );

  void notifyAdmin(
    `New Contact Form Submission — ${enquiryType}`,
    {
      Name: name,
      Phone: phone,
      Postcode: postcode,
      Enquiry: enquiryType,
      'Best time': callTime ?? 'any',
      Message: message ?? 'none',
    }
  );

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
    const users = await prisma.$queryRawUnsafe<RegisterUserRow[]>(
      `INSERT INTO users (name, email, phone, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, name, role`,
      name,
      email,
      phone,
      passwordHash,
      'USER'
    );

    const user = users[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
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

export default {
  PublicSiteError,
  getAreaCoverage,
  listInstructors,
  createInstructorApplication,
  createContactSubmission,
  registerUser,
  getTheoryQuestions,
};
