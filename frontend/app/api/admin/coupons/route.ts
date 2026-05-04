import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminCouponCreateSchema } from "@/lib/validations/coupon.schema";
import { normalizePromoCode } from "@/lib/promotions";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({
      data: coupons.map((c) => ({
        ...c,
        value: Number(c.value),
        maxDiscountAmount: c.maxDiscountAmount != null ? Number(c.maxDiscountAmount) : null,
        minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
      })),
    });
  } catch (err) {
    console.error("[admin/coupons GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = adminCouponCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const code = normalizePromoCode(d.code);

    const coupon = await prisma.coupon.create({
      data: {
        code,
        name: d.name ?? null,
        type: d.type,
        value: d.value,
        maxDiscountAmount: d.maxDiscountAmount ?? undefined,
        minOrderAmount: d.minOrderAmount ?? undefined,
        startsAt: d.startsAt ? new Date(d.startsAt) : undefined,
        endsAt: d.endsAt ? new Date(d.endsAt) : undefined,
        maxRedemptions: d.maxRedemptions ?? undefined,
        isActive: d.isActive ?? true,
      },
    });

    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (err) {
    console.error("[admin/coupons POST]", err);
    return NextResponse.json({ error: "Could not create coupon (duplicate code?)" }, { status: 400 });
  }
}
