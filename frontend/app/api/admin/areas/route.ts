import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const areas = await prisma.area.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ data: areas });
  } catch (err) {
    console.error("[admin/areas GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { name, postcodePrefix, description, isActive } = body;

    if (!name || !postcodePrefix) {
      return NextResponse.json({ error: "name and postcodePrefix are required" }, { status: 400 });
    }

    const area = await prisma.area.create({
      data: {
        name,
        postcodePrefix,
        description: description ?? "",
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ data: area }, { status: 201 });
  } catch (err) {
    console.error("[admin/areas POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
