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

    const availability = await prisma.availability.findMany({
      where: { instructorId: instructor.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json({ data: availability });
  } catch (err) {
    console.error("[instructor/schedule GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "INSTRUCTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructor) return NextResponse.json({ error: "Instructor profile not found" }, { status: 404 });

    const { slots } = await request.json();
    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 400 });
    }

    await prisma.availability.deleteMany({ where: { instructorId: instructor.id } });
    await prisma.availability.createMany({
      data: slots.map(
        (s: { dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }) => ({
          instructorId: instructor.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          isAvailable: s.isAvailable,
        }),
      ),
    });

    return NextResponse.json({ success: true, count: slots.length });
  } catch (err) {
    console.error("[instructor/schedule POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
