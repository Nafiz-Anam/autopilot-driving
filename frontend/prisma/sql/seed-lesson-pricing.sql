-- Default lesson pricing (used when Prisma adapter seed delegates skip JS upserts).
-- Safe to re-run: conflicts update prices/timestamps only.

INSERT INTO "LessonPricingCategory" ("id","lessonType","slug","displayName","description","sortOrder","isActive","createdAt","updatedAt")
VALUES
('seed_lp_manual','MANUAL','manual','Manual Driving Lessons',NULL,0,true,NOW(),NOW()),
('seed_lp_auto','AUTOMATIC','automatic','Automatic Driving Lessons',NULL,1,true,NOW(),NOW()),
('seed_lp_int','INTENSIVE','intensive','Intensive Courses',NULL,2,true,NOW(),NOW()),
('seed_lp_ref','REFRESHER','refresher','Refresher Lessons',NULL,3,true,NOW(),NOW()),
('seed_lp_pp','PASS_PLUS','pass-plus','Pass Plus',NULL,4,true,NOW(),NOW()),
('seed_lp_theory','THEORY','theory','Theory Training',NULL,5,true,NOW(),NOW())
ON CONFLICT ("lessonType") DO UPDATE SET
  "slug" = EXCLUDED."slug",
  "displayName" = EXCLUDED."displayName",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

INSERT INTO "LessonPricingPackage" ("id","categoryId","slug","name","hours","lessons","price","pricePerHour","savings","footerNote","badge","isPopular","sortOrder","isActive","createdAt","updatedAt")
VALUES
('seed_pkg_m_single','seed_lp_manual','single','1 Hour',1,1,42.00,42.00,NULL,'Pay per lesson',NULL,false,0,true,NOW(),NOW()),
('seed_pkg_m_b5','seed_lp_manual','block5','5 Hours',5,5,195.00,39.00,15,'£195 block booked','Most Popular',true,1,true,NOW(),NOW()),
('seed_pkg_m_b10','seed_lp_manual','block10','10 Hours',10,10,380.00,38.00,40,'£380 block booked',NULL,false,2,true,NOW(),NOW()),
('seed_pkg_m_b20','seed_lp_manual','block20','20 Hours',20,20,720.00,36.00,120,'£720 block booked',NULL,false,3,true,NOW(),NOW()),
('seed_pkg_a_single','seed_lp_auto','single','1 Hour',1,1,44.00,44.00,NULL,'Pay per lesson',NULL,false,0,true,NOW(),NOW()),
('seed_pkg_a_b5','seed_lp_auto','block5','5 Hours',5,5,205.00,41.00,15,'£205 block booked',NULL,false,1,true,NOW(),NOW()),
('seed_pkg_int','seed_lp_int','intensive-20','20-hour intensive',20,20,680.00,34.00,160,NULL,NULL,false,0,true,NOW(),NOW()),
('seed_pkg_ref','seed_lp_ref','refresher-2','2-hour refresher',2,2,90.00,45.00,NULL,NULL,NULL,false,0,true,NOW(),NOW()),
('seed_pkg_pp','seed_lp_pp','pass-plus-full','Pass Plus course',6,1,260.00,NULL,NULL,NULL,NULL,true,0,true,NOW(),NOW()),
('seed_pkg_theory','seed_lp_theory','portal-access','Theory portal access',1,1,29.00,NULL,NULL,'Full question bank and mock tests',NULL,true,0,true,NOW(),NOW())
ON CONFLICT ("categoryId","slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "hours" = EXCLUDED."hours",
  "lessons" = EXCLUDED."lessons",
  "price" = EXCLUDED."price",
  "pricePerHour" = EXCLUDED."pricePerHour",
  "savings" = EXCLUDED."savings",
  "footerNote" = EXCLUDED."footerNote",
  "badge" = EXCLUDED."badge",
  "isPopular" = EXCLUDED."isPopular",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();
