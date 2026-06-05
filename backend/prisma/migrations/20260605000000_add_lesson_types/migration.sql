-- Add REFRESHER, PASS_PLUS, MOTORWAY, MOCK_TEST to the LessonType enum
ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'REFRESHER';
ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'PASS_PLUS';
ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'MOTORWAY';
ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'MOCK_TEST';

-- Seed pricing categories for the new lesson types
INSERT INTO "LessonPricingCategory" (id, "lessonType", slug, "displayName", description, "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('seed-cat-refresher',  'REFRESHER',  'refresher-lessons', 'Refresher Lessons',    'Back behind the wheel after a break', 5, true, NOW(), NOW()),
  ('seed-cat-pass-plus',  'PASS_PLUS',  'pass-plus',         'Pass Plus',            'Advanced post-test training course',  6, true, NOW(), NOW()),
  ('seed-cat-motorway',   'MOTORWAY',   'motorway-lessons',  'Motorway Lessons',     'Safe motorway driving with an ADI',   7, true, NOW(), NOW()),
  ('seed-cat-mock-test',  'MOCK_TEST',  'mock-test',         'Mock Test',            'Full mock driving test session',      8, true, NOW(), NOW())
ON CONFLICT ("lessonType") DO UPDATE SET
  slug          = EXCLUDED.slug,
  "displayName" = EXCLUDED."displayName",
  description   = EXCLUDED.description,
  "sortOrder"   = EXCLUDED."sortOrder",
  "isActive"    = EXCLUDED."isActive",
  "updatedAt"   = NOW();

-- Seed starter packages for each new category
INSERT INTO "LessonPricingPackage"
  (id, "categoryId", slug, name, hours, lessons, price, "pricePerHour", savings, "footerNote", badge, "isPopular", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
  ('seed-pkg-refresher-single', 'seed-cat-refresher', 'single',   'Single Refresher',    1,  1,  47.00, 47.00, NULL,   'Pay as you go',            NULL,          false, 1, true, NOW(), NOW()),
  ('seed-pkg-refresher-block5', 'seed-cat-refresher', 'block5',   'Refresher 5 Hours',   5,  5,  215.00, 43.00, 20.00, 'Get your confidence back', 'Popular',     true,  2, true, NOW(), NOW()),
  ('seed-pkg-pass-plus-std',    'seed-cat-pass-plus', 'standard', 'Pass Plus Standard',  6,  6,  210.00, 35.00, NULL,  'DVSA-recognised course',   'Recommended', true,  1, true, NOW(), NOW()),
  ('seed-pkg-motorway-single',  'seed-cat-motorway',  'single',   'Single Motorway',     1,  1,  50.00, 50.00, NULL,   'Pay as you go',            NULL,          false, 1, true, NOW(), NOW()),
  ('seed-pkg-motorway-block3',  'seed-cat-motorway',  'block3',   'Motorway 3 Hours',    3,  3,  138.00, 46.00, 12.00, 'Build confidence at speed', 'Popular',    true,  2, true, NOW(), NOW()),
  ('seed-pkg-mock-test-single', 'seed-cat-mock-test', 'single',   'Mock Test Session',   2,  1,  75.00, 37.50, NULL,   'Full test-route debrief',  NULL,          false, 1, true, NOW(), NOW()),
  ('seed-pkg-mock-test-x2',     'seed-cat-mock-test', 'two-pack', 'Mock Test × 2',       4,  2,  140.00, 35.00, 10.00, 'Two sessions + feedback',  'Best Value',  true,  2, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  price          = EXCLUDED.price,
  "pricePerHour" = EXCLUDED."pricePerHour",
  savings        = EXCLUDED.savings,
  "isPopular"    = EXCLUDED."isPopular",
  "updatedAt"    = NOW();
