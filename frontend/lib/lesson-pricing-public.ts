import type { LessonType } from "@prisma/client";
import type { Package } from "@/types";

/** Public API / UI — all money as plain numbers (GBP). Safe for Client Components (no DB imports). */
export type PublicPricingPackage = {
  id: string;
  slug: string;
  name: string;
  hours: number;
  lessons: number;
  price: number;
  pricePerHour: number | null;
  pricePerLesson: number;
  savings: number | null;
  footerNote: string | null;
  badge: string | null;
  isPopular: boolean;
  sortOrder: number;
};

export type PublicPricingCategory = {
  id: string;
  lessonType: LessonType;
  slug: string;
  displayName: string;
  description: string | null;
  sortOrder: number;
  packages: PublicPricingPackage[];
};

function num(d: unknown): number {
  if (typeof d === "number") return d;
  return Number(d);
}

export function toPublicPackage(row: {
  id: string;
  slug: string;
  name: string;
  hours: number;
  lessons: number;
  price: unknown;
  pricePerHour: unknown | null;
  savings: unknown | null;
  footerNote: string | null;
  badge: string | null;
  isPopular: boolean;
  sortOrder: number;
}): PublicPricingPackage {
  const price = num(row.price);
  const lessons = Math.max(1, row.lessons);
  const pricePerLesson = Math.round((price / lessons) * 100) / 100;
  const pricePerHour =
    row.pricePerHour != null ? num(row.pricePerHour) : lessons > 0 ? Math.round((price / row.hours) * 100) / 100 : null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    hours: row.hours,
    lessons: row.lessons,
    price,
    pricePerHour,
    pricePerLesson,
    savings: row.savings != null ? num(row.savings) : null,
    footerNote: row.footerNote,
    badge: row.badge,
    isPopular: row.isPopular,
    sortOrder: row.sortOrder,
  };
}

/** Wizard `Package` shape — compatible with booking store + summary. */
export function publicPackageToBookingPackage(p: PublicPricingPackage): Package {
  return {
    id: p.id,
    name: p.name,
    lessons: p.lessons,
    hours: p.hours,
    price: p.price,
    pricePerLesson: p.pricePerLesson,
    savings: p.savings ?? 0,
    isPopular: p.isPopular,
    badge: p.badge ?? undefined,
  };
}
