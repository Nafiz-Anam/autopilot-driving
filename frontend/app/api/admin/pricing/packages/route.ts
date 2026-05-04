import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminPricingPackageCreateSchema } from "@/lib/validations/pricing.schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = adminPricingPackageCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const created = await prisma.lessonPricingPackage.create({
      data: {
        categoryId: d.categoryId,
        slug: d.slug,
        name: d.name,
        hours: d.hours,
        lessons: d.lessons,
        price: d.price,
        pricePerHour: d.pricePerHour ?? undefined,
        savings: d.savings ?? undefined,
        footerNote: d.footerNote ?? undefined,
        badge: d.badge ?? undefined,
        isPopular: d.isPopular ?? false,
        sortOrder: d.sortOrder ?? 0,
        isActive: d.isActive ?? true,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("[admin/pricing/packages POST]", err);
    return NextResponse.json({ error: "Could not create package (duplicate slug?)" }, { status: 400 });
  }
}
