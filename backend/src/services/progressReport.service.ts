import httpStatus from 'http-status';
import { SkillCompetencyLevel } from '@prisma/client';
import prisma from '../client';
import ApiError from '../utils/ApiError';

interface ScoreInput {
  skillId: string;
  level: SkillCompetencyLevel;
  note?: string;
}

interface UpsertReportInput {
  overallNotes?: string;
  scores: ScoreInput[];
}

const LEVEL_WEIGHT: Record<string, number> = {
  NOT_COVERED: 0,
  NEEDS_PRACTICE: 1,
  UNDER_INSTRUCTION: 2,
  INDEPENDENT: 3,
};

const listActiveSkills = async () => {
  return prisma.drivingSkill.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
};

const resolveInstructorBooking = async (bookingId: string, instructorUserId: string) => {
  const instructor = await prisma.instructor.findUnique({ where: { userId: instructorUserId } });
  if (!instructor) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  if (booking.instructorId !== instructor.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  return { booking, instructor };
};

const buildReportPayload = (
  booking: { id: string; scheduledAt: Date; status: string; lessonType: string },
  skills: { id: string; key: string; name: string }[],
  report:
    | ({ scores: { skillId: string; level: string; note: string | null }[] } & {
        id: string;
        published: boolean;
        publishedAt: Date | null;
        overallNotes: string | null;
        updatedAt: Date;
      })
    | null
) => {
  const scoreBySkillId = new Map(report?.scores.map(s => [s.skillId, s]) ?? []);
  return {
    exists: !!report,
    id: report?.id ?? null,
    bookingId: booking.id,
    published: report?.published ?? false,
    publishedAt: report?.publishedAt ?? null,
    overallNotes: report?.overallNotes ?? null,
    updatedAt: report?.updatedAt ?? null,
    booking: {
      id: booking.id,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      lessonType: booking.lessonType,
    },
    scores: skills.map(skill => {
      const score = scoreBySkillId.get(skill.id);
      return {
        skillId: skill.id,
        skillKey: skill.key,
        skillName: skill.name,
        level: score?.level ?? null,
        note: score?.note ?? null,
      };
    }),
  };
};

const getForInstructor = async (bookingId: string, instructorUserId: string) => {
  const { booking } = await resolveInstructorBooking(bookingId, instructorUserId);
  const [skills, report] = await Promise.all([
    listActiveSkills(),
    prisma.lessonProgressReport.findUnique({ where: { bookingId }, include: { scores: true } }),
  ]);
  return buildReportPayload(booking, skills, report);
};

const upsertDraft = async (
  bookingId: string,
  instructorUserId: string,
  data: UpsertReportInput
) => {
  const { booking, instructor } = await resolveInstructorBooking(bookingId, instructorUserId);
  if (booking.status !== 'COMPLETED') {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Progress report can only be saved once the lesson is completed'
    );
  }

  const skills = await listActiveSkills();
  const validSkillIds = new Set(skills.map(s => s.id));
  for (const score of data.scores) {
    if (!validSkillIds.has(score.skillId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Unknown skillId: ${score.skillId}`);
    }
  }

  await prisma.$transaction(async tx => {
    const existing = await tx.lessonProgressReport.findUnique({ where: { bookingId } });
    const report = existing
      ? await tx.lessonProgressReport.update({
          where: { bookingId },
          data: { overallNotes: data.overallNotes ?? null },
        })
      : await tx.lessonProgressReport.create({
          data: {
            bookingId,
            studentId: booking.studentId,
            instructorId: instructor.id,
            overallNotes: data.overallNotes ?? null,
          },
        });

    await Promise.all(
      data.scores.map(score =>
        tx.skillScore.upsert({
          where: { reportId_skillId: { reportId: report.id, skillId: score.skillId } },
          create: {
            reportId: report.id,
            skillId: score.skillId,
            level: score.level,
            note: score.note ?? null,
          },
          update: { level: score.level, note: score.note ?? null },
        })
      )
    );
  });

  return getForInstructor(bookingId, instructorUserId);
};

const publish = async (bookingId: string, instructorUserId: string) => {
  const { booking } = await resolveInstructorBooking(bookingId, instructorUserId);
  const existing = await prisma.lessonProgressReport.findUnique({ where: { bookingId } });
  if (!existing) {
    throw new ApiError(httpStatus.CONFLICT, 'Save a draft before publishing');
  }
  if (booking.status !== 'COMPLETED') {
    throw new ApiError(
      httpStatus.CONFLICT,
      'Progress report can only be published once the lesson is completed'
    );
  }
  await prisma.lessonProgressReport.update({
    where: { bookingId },
    data: { published: true, publishedAt: existing.publishedAt ?? new Date() },
  });
  return getForInstructor(bookingId, instructorUserId);
};

const unpublish = async (bookingId: string, instructorUserId: string) => {
  await resolveInstructorBooking(bookingId, instructorUserId);
  const existing = await prisma.lessonProgressReport.findUnique({ where: { bookingId } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Progress report not found');
  }
  await prisma.lessonProgressReport.update({
    where: { bookingId },
    data: { published: false },
  });
  return getForInstructor(bookingId, instructorUserId);
};

const getForStudent = async (bookingId: string, studentUserId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.studentId !== studentUserId) {
    // Same 404 whether the booking doesn't exist or isn't the caller's — avoids leaking booking existence.
    throw new ApiError(httpStatus.NOT_FOUND, 'Progress report not available');
  }

  const report = await prisma.lessonProgressReport.findFirst({
    where: { bookingId, published: true },
    include: { scores: true },
  });
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Progress report not available');
  }

  const skills = await listActiveSkills();
  return buildReportPayload(booking, skills, report);
};

const getOverviewForStudent = async (studentUserId: string) => {
  const skills = await listActiveSkills();
  const reports = await prisma.lessonProgressReport.findMany({
    where: { studentId: studentUserId, published: true },
    include: {
      scores: true,
      booking: { select: { id: true, scheduledAt: true, lessonType: true } },
    },
    orderBy: { booking: { scheduledAt: 'asc' } },
  });

  const latestBySkill = new Map<string, { level: string; lastAssessedAt: Date }>();
  for (const report of reports) {
    for (const score of report.scores) {
      latestBySkill.set(score.skillId, {
        level: score.level,
        lastAssessedAt: report.booking.scheduledAt,
      });
    }
  }

  const skillSummaries = skills.map(skill => {
    const latest = latestBySkill.get(skill.id);
    return {
      skillId: skill.id,
      skillKey: skill.key,
      skillName: skill.name,
      level: latest?.level ?? null,
      lastAssessedAt: latest?.lastAssessedAt ?? null,
    };
  });

  const assessed = skillSummaries.filter(s => s.level !== null);
  const overallPercent = assessed.length
    ? Math.round(
        (assessed.reduce((sum, s) => sum + LEVEL_WEIGHT[s.level as string], 0) /
          (assessed.length * 3)) *
          100
      )
    : 0;

  return {
    reportsCount: reports.length,
    overallPercent,
    skills: skillSummaries,
    recentReports: reports
      .slice()
      .reverse()
      .map(r => ({
        bookingId: r.booking.id,
        scheduledAt: r.booking.scheduledAt,
        lessonType: r.booking.lessonType,
        publishedAt: r.publishedAt,
      })),
  };
};

export default {
  listActiveSkills,
  getForInstructor,
  upsertDraft,
  publish,
  unpublish,
  getForStudent,
  getOverviewForStudent,
};
