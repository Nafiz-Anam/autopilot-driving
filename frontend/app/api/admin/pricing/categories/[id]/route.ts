import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminPricingCategoryUpdateSchema } from "@/lib/validations/pricing.schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = adminPricingCategoryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.lessonPricingCategory.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[admin/pricing/categories PATCH]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
