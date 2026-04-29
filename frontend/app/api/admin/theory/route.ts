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
    const category = searchParams.get("category") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));

    const where: Record<string, unknown> = {};
    if (category) where.category = category;

    const [total, questions] = await Promise.all([
      prisma.theoryQuestion.count({ where }),
      prisma.theoryQuestion.findMany({
        where,
        orderBy: { category: "asc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    ]);

    return NextResponse.json({
      data: questions,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/theory GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { category, question, options, correctIndex, explanation } = body;

    if (!category || !question || !Array.isArray(options) || correctIndex === undefined) {
      return NextResponse.json(
        { error: "category, question, options, and correctIndex are required" },
        { status: 400 }
      );
    }

    const created = await prisma.theoryQuestion.create({
      data: {
        category,
        question,
        options,
        correctIndex,
        ...(explanation !== undefined && { explanation }),
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("[admin/theory POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
