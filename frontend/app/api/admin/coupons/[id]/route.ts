import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  try {
    const body = (await request.json()) as { isActive?: boolean };
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      },
    });
    return NextResponse.json({ data: coupon });
  } catch (err) {
    console.error("[admin/coupons PATCH]", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
