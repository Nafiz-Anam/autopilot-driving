import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPublicPackage } from "@/lib/lesson-pricing";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const rows = await prisma.lessonPricingCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        packages: { orderBy: { sortOrder: "asc" } },
      },
    });

    const data = rows.map((c) => ({
      id: c.id,
      lessonType: c.lessonType,
      slug: c.slug,
      displayName: c.displayName,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      packages: c.packages.map((p) => ({
        ...toPublicPackage(p),
        isActive: p.isActive,
      })),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[admin/pricing/categories GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
