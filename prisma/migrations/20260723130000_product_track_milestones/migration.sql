-- CreateEnum
CREATE TYPE "MilestoneTrack" AS ENUM ('AI_LABS', 'PRODUCT');

-- DropIndex
DROP INDEX "architecture_milestones_order_key";

-- AlterTable
ALTER TABLE "architecture_milestones" ADD COLUMN     "track" "MilestoneTrack" NOT NULL DEFAULT 'AI_LABS',
ADD COLUMN     "weekId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "architecture_milestones_weekId_key" ON "architecture_milestones"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "architecture_milestones_track_order_key" ON "architecture_milestones"("track", "order");

-- AddForeignKey
ALTER TABLE "architecture_milestones" ADD CONSTRAINT "architecture_milestones_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
