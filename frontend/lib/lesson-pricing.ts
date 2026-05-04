import type { LessonType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  type PublicPricingCategory,
  type PublicPricingPackage,
  toPublicPackage,
} from "@/lib/lesson-pricing-public";

export type { PublicPricingPackage, PublicPricingCategory };
export { toPublicPackage, publicPackageToBookingPackage } from "@/lib/lesson-pricing-public";

export async function listActivePricingCategories(): Promise<PublicPricingCategory[]> {
  const rows = await prisma.lessonPricingCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    lessonType: c.lessonType,
    slug: c.slug,
    displayName: c.displayName,
    description: c.description,
    sortOrder: c.sortOrder,
    packages: c.packages.map(toPublicPackage),
  }));
}

export async function listPackagesForLessonType(lessonType: LessonType): Promise<PublicPricingPackage[]> {
  const cat = await prisma.lessonPricingCategory.findFirst({
    where: { lessonType, isActive: true },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!cat) return [];
  return cat.packages.map(toPublicPackage);
}

export async function resolvePackageForBooking(
  lessonType: LessonType,
  packageId: string
): Promise<{ package: PublicPricingPackage; totalAmount: number } | null> {
  const pkg = await prisma.lessonPricingPackage.findFirst({
    where: {
      id: packageId,
      isActive: true,
      category: { lessonType, isActive: true },
    },
    include: { category: true },
  });
  if (!pkg) return null;
  const pub = toPublicPackage(pkg);
  return { package: pub, totalAmount: pub.price };
}
