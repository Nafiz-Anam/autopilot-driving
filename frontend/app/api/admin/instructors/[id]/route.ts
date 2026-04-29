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
    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true },
        },
        bookings: {
          include: {
            student: { select: { name: true } },
          },
          orderBy: { scheduledAt: "desc" },
          take: 10,
        },
        _count: { select: { bookings: true } },
      },
    });

    if (!instructor) return NextResponse.json({ error: "Instructor not found" }, { status: 404 });

    return NextResponse.json({ data: instructor });
  } catch (err) {
    console.error("[admin/instructors/[id] GET]", err);
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

    const allowedFields = [
      "isActive",
      "pricePerHour",
      "bio",
      "rating",
      "reviewCount",
      "yearsExp",
      "areas",
      "transmission",
      "isFemale",
    ];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) data[field] = body[field];
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ data: instructor });
  } catch (err) {
    console.error("[admin/instructors/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
