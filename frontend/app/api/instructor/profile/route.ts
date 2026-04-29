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
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, image: true },
        },
      },
    });
    if (!instructor) return NextResponse.json({ error: "Instructor profile not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        ...instructor,
        pricePerHour: Number(instructor.pricePerHour),
      },
    });
  } catch (err) {
    console.error("[instructor/profile GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "INSTRUCTOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const instructor = await prisma.instructor.findUnique({
      where: { userId: session.user.id },
    });
    if (!instructor) return NextResponse.json({ error: "Instructor profile not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.bio !== undefined) data.bio = body.bio;
    if (body.pricePerHour !== undefined) data.pricePerHour = body.pricePerHour;
    if (body.areas !== undefined) data.areas = body.areas;
    if (body.transmission !== undefined) data.transmission = body.transmission;

    const updated = await prisma.instructor.update({
      where: { id: instructor.id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true } },
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        pricePerHour: Number(updated.pricePerHour),
      },
    });
  } catch (err) {
    console.error("[instructor/profile PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
