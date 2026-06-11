import prisma from '../client';

const LESSON_TYPES = ['MANUAL', 'AUTOMATIC', 'INTENSIVE', 'REFRESHER', 'PASS_PLUS', 'THEORY'] as const;
type LessonType = (typeof LESSON_TYPES)[number];

const isValidLessonType = (value: string): value is LessonType =>
  LESSON_TYPES.includes(value as LessonType);

const listActivePricingCategories = async () => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      lessonType: LessonType;
      slug: string;
      displayName: string;
      description: string | null;
      sortOrder: number;
      isActive: boolean;
    }>
  >(
    `SELECT id, "lessonType", slug, "displayName", description, "sortOrder", "isActive"
     FROM "LessonPricingCategory"
     WHERE "isActive" = true
     ORDER BY "createdAt" ASC`
  );
  const byCategory = new Map();
  for (const cat of rows) {
    byCategory.set(cat.id, { ...cat, packages: [] });
  }

  const pkgs = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      categoryId: string;
      slug: string;
      name: string;
      hours: number;
      lessons: number;
      price: string;
      pricePerHour: string | null;
      savings: string | null;
      footerNote: string | null;
      badge: string | null;
      isPopular: boolean;
      sortOrder: number;
    }>
  >(
    `SELECT id, "categoryId", slug, name, hours, lessons, price::text AS price,
            "pricePerHour"::text AS "pricePerHour", savings::text AS savings,
            "footerNote", badge, "isPopular", "sortOrder"
     FROM "LessonPricingPackage"
     WHERE "isActive" = true
     ORDER BY "categoryId" ASC, "createdAt" ASC`
  );

  for (const p of pkgs) {
    const cat = byCategory.get(p.categoryId);
    if (!cat) continue;
    cat.packages.push({
      ...p,
      price: Number(p.price),
      pricePerHour: p.pricePerHour == null ? null : Number(p.pricePerHour),
      savings: p.savings == null ? null : Number(p.savings),
    });
  }

  return Array.from(byCategory.values());
};

const listPackagesForLessonType = async (lessonType: string) => {
  if (!isValidLessonType(lessonType)) {
    return null;
  }

  const categoryRows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      lessonType: LessonType;
      slug: string;
      displayName: string;
      description: string | null;
      sortOrder: number;
      isActive: boolean;
    }>
  >(
    `SELECT id, "lessonType", slug, "displayName", description, "sortOrder", "isActive"
     FROM "LessonPricingCategory"
     WHERE "isActive" = true AND "lessonType" = $1
     LIMIT 1`,
    lessonType
  );

  const category = categoryRows[0];
  if (!category) {
    return [];
  }

  const packages = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      categoryId: string;
      slug: string;
      name: string;
      hours: number;
      lessons: number;
      price: string;
      pricePerHour: string | null;
      savings: string | null;
      footerNote: string | null;
      badge: string | null;
      isPopular: boolean;
      sortOrder: number;
      isActive: boolean;
    }>
  >(
    `SELECT id, "categoryId", slug, name, hours, lessons, price::text AS price,
            "pricePerHour"::text AS "pricePerHour", savings::text AS savings,
            "footerNote", badge, "isPopular", "sortOrder", "isActive"
     FROM "LessonPricingPackage"
     WHERE "isActive" = true AND "categoryId" = $1
     ORDER BY "createdAt" ASC`,
    category.id
  );

  return packages.map((row) => ({
    ...row,
    price: Number(row.price),
    pricePerHour: row.pricePerHour == null ? null : Number(row.pricePerHour),
    savings: row.savings == null ? null : Number(row.savings),
  }));
};

/** Resolve active package price for a booking (matches frontend lesson-pricing). */
const resolvePackageForBooking = async (lessonType: string, packageId: string) => {
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      price: string;
    }>
  >(
    `SELECT p.id, p.price::text AS price
     FROM "LessonPricingPackage" p
     INNER JOIN "LessonPricingCategory" c ON c.id = p."categoryId"
     WHERE p.id = $1 AND p."isActive" = true AND c."lessonType"::text = $2 AND c."isActive" = true
     LIMIT 1`,
    packageId,
    lessonType
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return { packageId: row.id, totalAmount: Number(row.price) };
};

export default {
  LESSON_TYPES,
  listActivePricingCategories,
  listPackagesForLessonType,
  resolvePackageForBooking,
};
