import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "INSTRUCTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructor) return NextResponse.json({ error: "Instructor profile not found" }, { status: 404 });

    const bookings = await prisma.booking.findMany({
      where: { instructorId: instructor.id },
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true, image: true },
        },
      },
      orderBy: { scheduledAt: "desc" },
    });

    const studentMap = new Map<
      string,
      {
        student: { id: string; name: string | null; email: string; phone: string | null; image: string | null };
        bookings: typeof bookings;
      }
    >();

    for (const booking of bookings) {
      const sid = booking.studentId;
      if (!studentMap.has(sid)) {
        studentMap.set(sid, { student: booking.student, bookings: [] });
      }
      studentMap.get(sid)!.bookings.push(booking);
    }

    type BookingRow = (typeof bookings)[number];

    const students = Array.from(studentMap.values()).map(({ student, bookings: sb }) => {
      const completedLessons = sb.filter((b: BookingRow) => b.status === "COMPLETED").length;
      const lastLesson = sb[0]?.scheduledAt?.toISOString() ?? null;
      const progress = Math.min(Math.round((completedLessons / 20) * 100), 100);
      const recentBookings = sb.slice(0, 5).map((b: BookingRow) => ({
        date: b.scheduledAt.toISOString(),
        lessonType: b.lessonType,
        durationMins: b.durationMins,
        status: b.status,
        notes: b.notes ?? null,
      }));

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        image: student.image,
        totalLessons: sb.length,
        completedLessons,
        lastLesson,
        progress,
        recentBookings,
      };
    });

    return NextResponse.json({ data: students });
  } catch (err) {
    console.error("[instructor/students GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
