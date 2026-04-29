import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

    const where: Record<string, unknown> = {};
    if (status && ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(status)) {
      where.status = status;
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          student: { select: { name: true, email: true } },
          instructor: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: bookings.map((b: any) => ({ ...b, totalAmount: Number(b.totalAmount) })),
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/bookings GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "id and status are required" }, { status: 400 });

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ data: booking });
  } catch (err) {
    console.error("[admin/bookings PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
