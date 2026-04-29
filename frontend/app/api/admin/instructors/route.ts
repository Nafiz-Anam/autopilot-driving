import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? "";
    const isActiveParam = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (isActiveParam !== null && isActiveParam !== "") {
      where.isActive = isActiveParam === "true";
    }
    if (search) {
      where.user = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const instructors = await prisma.instructor.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, createdAt: true },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: instructors.map((inst: any) => ({
        ...inst,
        rating: Number(inst.rating),
        pricePerHour: Number(inst.pricePerHour),
      })),
    });
  } catch (err) {
    console.error("[admin/instructors GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id, isActive, pricePerHour, bio } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (pricePerHour !== undefined) data.pricePerHour = pricePerHour;
    if (bio !== undefined) data.bio = bio;

    const instructor = await prisma.instructor.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ data: instructor });
  } catch (err) {
    console.error("[admin/instructors PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
