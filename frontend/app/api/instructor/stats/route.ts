import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "INSTRUCTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructor) return NextResponse.json({ error: "Instructor profile not found" }, { status: 404 });

    const now = new Date();

    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    const [
      lessonsThisWeek,
      monthBookings,
      allBookingsForStudents,
      todayBookings,
      upcomingBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          instructorId: instructor.id,
          scheduledAt: { gte: weekStart, lt: weekEnd },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),
      prisma.booking.findMany({
        where: {
          instructorId: instructor.id,
          scheduledAt: { gte: monthStart },
          paymentStatus: "PAID",
        },
        select: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { instructorId: instructor.id },
        select: { studentId: true },
      }),
      prisma.booking.findMany({
        where: {
          instructorId: instructor.id,
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: {
          student: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.booking.findMany({
        where: {
          instructorId: instructor.id,
          scheduledAt: { gt: now, lt: next7Days },
          status: { in: ["CONFIRMED", "PENDING"] },
        },
        include: {
          student: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      }),
    ]);

    const earningsThisMonth = monthBookings.reduce(
      (sum: number, b: { totalAmount: unknown }) => sum + Number(b.totalAmount),
      0,
    );

    type StudentIdRow = { studentId: string };
    type LessonRow = {
      id: string;
      scheduledAt: Date;
      durationMins: number;
      lessonType: string;
      transmission: string;
      student: { name: string | null };
    };

    const uniqueStudentIds = new Set(
      (allBookingsForStudents as StudentIdRow[]).map((b) => b.studentId),
    );
    const totalStudents = uniqueStudentIds.size;

    const area = instructor.areas[0] ?? "";

    return NextResponse.json({
      lessonsThisWeek,
      earningsThisMonth,
      avgRating: instructor.rating,
      totalStudents,
      todayLessons: (todayBookings as LessonRow[]).map((b) => ({
        id: b.id,
        scheduledAt: b.scheduledAt.toISOString(),
        durationMins: b.durationMins,
        lessonType: b.lessonType,
        transmission: b.transmission,
        studentName: b.student.name,
        studentInitials: getInitials(b.student.name ?? ""),
      })),
      upcomingLessons: (upcomingBookings as LessonRow[]).map((b) => ({
        id: b.id,
        scheduledAt: b.scheduledAt.toISOString(),
        durationMins: b.durationMins,
        lessonType: b.lessonType,
        transmission: b.transmission,
        studentName: b.student.name,
        studentInitials: getInitials(b.student.name ?? ""),
        area,
      })),
    });
  } catch (err) {
    console.error("[instructor/stats GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
