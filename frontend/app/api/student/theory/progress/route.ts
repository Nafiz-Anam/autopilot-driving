import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const studentId = session.user.id;

    const progress = await prisma.studentTheoryProgress.findMany({
      where: { studentId },
      include: {
        question: { select: { category: true } },
      },
    });

    const grouped: Record<string, { correct: number; total: number }> = {};
    for (const p of progress) {
      const cat = p.question.category;
      if (!grouped[cat]) {
        grouped[cat] = { correct: 0, total: 0 };
      }
      grouped[cat].total += 1;
      if (p.isCorrect) grouped[cat].correct += 1;
    }

    const categories = Object.entries(grouped).map(([category, data]) => ({
      category,
      correct: data.correct,
      total: data.total,
      score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    return NextResponse.json({ data: categories });
  } catch (err) {
    console.error("[student/theory/progress GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const studentId = session.user.id;
    const { questionId, isCorrect } = await request.json();

    await prisma.studentTheoryProgress.create({
      data: {
        studentId,
        questionId,
        isCorrect,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[student/theory/progress POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
