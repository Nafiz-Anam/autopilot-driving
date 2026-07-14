import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import prisma from '../client';

type ProfileUpdateInput = {
  name?: string;
  phone?: string | null;
};

const getProfile = async (userId: string) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      image: string | null;
      role: string;
      createdAt: Date;
    }>
  >(
    `SELECT id, name, email, phone, "profilePicture" AS image, role::text AS role, "createdAt"
     FROM users
     WHERE id = $1
     LIMIT 1`,
    userId
  );

  return rows[0] ?? null;
};

const updateProfile = async (userId: string, input: ProfileUpdateInput) => {
  const updates: string[] = [];
  const values: Array<string | null> = [];

  if (input.name !== undefined) {
    updates.push(`name = $${values.length + 2}`);
    values.push(input.name);
  }
  if (input.phone !== undefined) {
    updates.push(`phone = $${values.length + 2}`);
    values.push(input.phone);
  }

  if (updates.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE users
       SET ${updates.join(', ')}, "updatedAt" = NOW()
       WHERE id = $1`,
      userId,
      ...values
    );
  }

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      role: string;
    }>
  >(
    `SELECT id, name, email, phone, role::text AS role
     FROM users
     WHERE id = $1
     LIMIT 1`,
    userId
  );

  return rows[0] ?? null;
};

const changePassword = async (userId: string, current: string, newPassword: string) => {
  const rows = await prisma.$queryRawUnsafe<Array<{ password: string | null }>>(
    `SELECT password FROM users WHERE id = $1 LIMIT 1`,
    userId
  );
  const user = rows[0];

  if (!user?.password) {
    return { error: 'NO_PASSWORD' as const };
  }

  const valid = await bcrypt.compare(current, user.password);
  if (!valid) {
    return { error: 'INVALID_CURRENT' as const };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.$executeRawUnsafe(
    `UPDATE users SET password = $2, "updatedAt" = NOW() WHERE id = $1`,
    userId,
    newHash
  );

  return { success: true as const };
};

const getStats = async (studentId: string) => {
  const [bookingStats] = await prisma.$queryRawUnsafe<
    Array<{ completedCount: number; totalDurationMins: number }>
  >(
    `SELECT COUNT(*)::int AS "completedCount",
            COALESCE(SUM("durationMins"), 0)::int AS "totalDurationMins"
     FROM "Booking"
     WHERE "studentId" = $1
       AND status = 'COMPLETED'`,
    studentId
  );

  const [nextLesson] = await prisma.$queryRawUnsafe<
    Array<{
      scheduledAt: Date;
      instructorName: string | null;
      lessonType: string;
      durationMins: number;
    }>
  >(
    `SELECT b."scheduledAt",
            b."lessonType"::text AS "lessonType",
            b."durationMins",
            u.name AS "instructorName"
     FROM "Booking" b
     INNER JOIN "Instructor" i ON i.id = b."instructorId"
     INNER JOIN users u ON u.id = i."userId"
     WHERE b."studentId" = $1
       AND b.status IN ('CONFIRMED', 'PENDING')
       AND b."scheduledAt" >= NOW()
     ORDER BY b."scheduledAt" ASC
     LIMIT 1`,
    studentId
  );

  const [theory] = await prisma.$queryRawUnsafe<Array<{ attempts: number; correctCount: number }>>(
    `SELECT COUNT(*)::int AS attempts,
            COALESCE(SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END), 0)::int AS "correctCount"
     FROM "StudentTheoryProgress"
     WHERE "studentId" = $1`,
    studentId
  );

  const lessonsCompleted = bookingStats?.completedCount ?? 0;
  const totalDurationMins = bookingStats?.totalDurationMins ?? 0;
  const hoursTotal = totalDurationMins / 60;
  const theoryAttempts = theory?.attempts ?? 0;
  const correctCount = theory?.correctCount ?? 0;
  const theoryScore = theoryAttempts > 0 ? Math.round((correctCount / theoryAttempts) * 100) : 0;

  return {
    lessonsCompleted,
    hoursTotal,
    nextLesson: nextLesson
      ? {
          scheduledAt: nextLesson.scheduledAt.toISOString(),
          instructorName: nextLesson.instructorName,
          lessonType: nextLesson.lessonType,
          durationMins: nextLesson.durationMins,
        }
      : null,
    theoryScore,
    theoryAttempts,
  };
};

const getTheoryProgress = async (studentId: string) => {
  const rows = await prisma.$queryRawUnsafe<Array<{ category: string; isCorrect: boolean }>>(
    `SELECT q.category, p."isCorrect"
     FROM "StudentTheoryProgress" p
     INNER JOIN "TheoryQuestion" q ON q.id = p."questionId"
     WHERE p."studentId" = $1`,
    studentId
  );

  const grouped: Record<string, { correct: number; total: number }> = {};
  for (const row of rows) {
    if (!grouped[row.category]) {
      grouped[row.category] = { correct: 0, total: 0 };
    }
    grouped[row.category].total += 1;
    if (row.isCorrect) grouped[row.category].correct += 1;
  }

  return Object.entries(grouped).map(([category, data]) => ({
    category,
    correct: data.correct,
    total: data.total,
    score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  }));
};

const createTheoryProgress = async (
  studentId: string,
  questionId: string | null | undefined,
  isCorrect: boolean | null | undefined
) => {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "StudentTheoryProgress" (id, "studentId", "questionId", "isCorrect", "attemptedAt")
     VALUES ($1, $2, $3, $4, $5::timestamp)`,
    uuidv4(),
    studentId,
    questionId,
    isCorrect,
    new Date().toISOString()
  );
};

const getTheoryQuestions = async (limit = 10) => {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, category, question, options, "correctIndex", explanation
     FROM "TheoryQuestion"
     ORDER BY RANDOM()
     LIMIT $1`,
    limit
  );
  return rows.map(r => ({
    id: r.id as string,
    category: r.category as string,
    question: r.question as string,
    options: Array.isArray(r.options) ? r.options : JSON.parse(r.options as string),
    correct: r.correctIndex as number,
    explanation: (r.explanation ?? '') as string,
  }));
};

export default {
  getProfile,
  updateProfile,
  changePassword,
  getStats,
  getTheoryProgress,
  createTheoryProgress,
  getTheoryQuestions,
};
