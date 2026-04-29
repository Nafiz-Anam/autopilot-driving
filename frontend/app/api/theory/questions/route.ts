import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }

    if (session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const category = searchParams.get("category") ?? undefined;

    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.theoryQuestion.findMany({
        where: category ? { category } : undefined,
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          question: true,
          options: true,
          explanation: true,
          imageUrl: true,
          // Intentionally exclude correctIndex from response
          attempts: {
            where: { studentId: session.user.id },
            select: {
              isCorrect: true,
              attemptedAt: true,
            },
            orderBy: { attemptedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.theoryQuestion.count({
        where: category ? { category } : undefined,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        questions: questions.map((q: any) => ({
          id: q.id,
          category: q.category,
          question: q.question,
          options: q.options,
          explanation: q.explanation,
          imageUrl: q.imageUrl,
          lastAttempt: q.attempts[0] ?? null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[theory/questions] error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
