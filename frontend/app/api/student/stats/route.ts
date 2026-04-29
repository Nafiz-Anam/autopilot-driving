import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const studentId = session.user.id;

    const [completedBookingsCount, allCompleted, nextLesson, theoryProgress] = await Promise.all([
      prisma.booking.count({
        where: { studentId, status: "COMPLETED" },
      }),
      prisma.booking.findMany({
        where: { studentId, status: "COMPLETED" },
        select: { durationMins: true },
      }),
      prisma.booking.findFirst({
        where: {
          studentId,
          status: { in: ["CONFIRMED", "PENDING"] },
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          instructor: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      prisma.studentTheoryProgress.findMany({
        where: { studentId },
      }),
    ]);

    const hoursTotal =
      allCompleted.reduce((sum: number, b: { durationMins: number }) => sum + b.durationMins, 0) / 60;

    const theoryAttempts = theoryProgress.length;
    const correctCount = theoryProgress.filter((p: { isCorrect: boolean }) => p.isCorrect).length;
    const theoryScore = theoryAttempts > 0 ? Math.round((correctCount / theoryAttempts) * 100) : 0;

    return NextResponse.json({
      lessonsCompleted: completedBookingsCount,
      hoursTotal,
      nextLesson: nextLesson
        ? {
            scheduledAt: nextLesson.scheduledAt.toISOString(),
            instructorName: nextLesson.instructor.user.name,
            lessonType: nextLesson.lessonType,
            durationMins: nextLesson.durationMins,
          }
        : null,
      theoryScore,
      theoryAttempts,
    });
  } catch (err) {
    console.error("[student/stats GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
