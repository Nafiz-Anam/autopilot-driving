import { z } from "zod";

export const adminPricingCategoryUpdateSchema = z.object({
  displayName: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const adminPricingPackageCreateSchema = z.object({
  categoryId: z.string().cuid(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  hours: z.number().int().positive(),
  lessons: z.number().int().positive(),
  price: z.number().nonnegative(),
  pricePerHour: z.number().nonnegative().nullable().optional(),
  savings: z.number().nonnegative().nullable().optional(),
  footerNote: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const adminPricingPackageUpdateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().min(1).optional(),
  hours: z.number().int().positive().optional(),
  lessons: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  pricePerHour: z.number().nonnegative().nullable().optional(),
  savings: z.number().nonnegative().nullable().optional(),
  footerNote: z.string().nullable().optional(),
  badge: z.string().nullable().optional(),
  isPopular: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
