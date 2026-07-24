-- Custom Slots availability mode is being removed entirely; every instructor
-- is now permanently on Calendar Sync (real calendar busy blocks + existing
-- bookings decide bookability). The weekly Availability template and the
-- per-instructor mode toggle no longer have any code path that reads them.

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_instructorId_fkey";

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "availabilityMode";

-- DropTable
DROP TABLE "Availability";

-- DropEnum
DROP TYPE "AvailabilityMode";
