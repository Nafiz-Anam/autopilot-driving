-- Lesson pricing (admin-managed categories and packages)

CREATE TABLE "LessonPricingCategory" (
    "id" TEXT NOT NULL,
    "lessonType" "LessonType" NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPricingCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonPricingCategory_lessonType_key" ON "LessonPricingCategory"("lessonType");

CREATE TABLE "LessonPricingPackage" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "lessons" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "pricePerHour" DECIMAL(10,2),
    "savings" DECIMAL(10,2),
    "footerNote" TEXT,
    "badge" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPricingPackage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LessonPricingPackage_categoryId_slug_key" ON "LessonPricingPackage"("categoryId", "slug");

CREATE INDEX "LessonPricingPackage_categoryId_isActive_sortOrder_idx" ON "LessonPricingPackage"("categoryId", "isActive", "sortOrder");

ALTER TABLE "LessonPricingPackage" ADD CONSTRAINT "LessonPricingPackage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "LessonPricingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Booking" ADD COLUMN "pricingPackageId" TEXT;

ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pricingPackageId_fkey" FOREIGN KEY ("pricingPackageId") REFERENCES "LessonPricingPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
