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
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status;
    }

    const [total, applications] = await Promise.all([
      prisma.instructorApplication.count({ where }),
      prisma.instructorApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      data: applications,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/applications GET]", err);
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
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.instructorApplication.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ data: application });
  } catch (err) {
    console.error("[admin/applications PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
