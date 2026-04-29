import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const { id } = await params;
    const { action } = await request.json();
    if (action !== "cancel") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, studentId: true, status: true, scheduledAt: true },
    });

    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (booking.studentId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      return NextResponse.json({ error: "Booking cannot be cancelled" }, { status: 400 });
    }

    const hoursUntilLesson = (booking.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilLesson < 24) {
      return NextResponse.json({ error: "Cannot cancel within 24 hours of lesson" }, { status: 400 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      select: { id: true, status: true },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[bookings/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
