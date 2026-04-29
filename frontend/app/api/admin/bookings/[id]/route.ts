import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, email: true, phone: true, image: true },
        },
        instructor: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, image: true } },
          },
        },
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json({ data: booking });
  } catch (err) {
    console.error("[admin/bookings/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];
    const validPaymentStatuses = ["UNPAID", "PAID", "REFUNDED", "PARTIAL_REFUND"];

    if (body.status && validStatuses.includes(body.status)) {
      data.status = body.status;
    }
    if (body.paymentStatus && validPaymentStatuses.includes(body.paymentStatus)) {
      data.paymentStatus = body.paymentStatus;
    }
    if (body.notes !== undefined) {
      data.notes = body.notes;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: booking });
  } catch (err) {
    console.error("[admin/bookings/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
