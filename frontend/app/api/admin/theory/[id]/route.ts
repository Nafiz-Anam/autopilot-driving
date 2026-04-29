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
    const question = await prisma.theoryQuestion.findUnique({ where: { id } });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });
    return NextResponse.json({ data: question });
  } catch (err) {
    console.error("[admin/theory/[id] GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { category, question, options, correctIndex, explanation } = body;

    const updated = await prisma.theoryQuestion.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(question !== undefined && { question }),
        ...(options !== undefined && { options }),
        ...(correctIndex !== undefined && { correctIndex }),
        ...(explanation !== undefined && { explanation }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[admin/theory/[id] PUT]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.theoryQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/theory/[id] DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
