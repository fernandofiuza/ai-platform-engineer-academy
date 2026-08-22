-- DropIndex
DROP INDEX "external_modules_courseId_order_key";

-- AlterTable
ALTER TABLE "external_modules" ADD COLUMN     "parentModuleId" TEXT;

-- CreateIndex
CREATE INDEX "external_modules_courseId_parentModuleId_idx" ON "external_modules"("courseId", "parentModuleId");

-- AddForeignKey
ALTER TABLE "external_modules" ADD CONSTRAINT "external_modules_parentModuleId_fkey" FOREIGN KEY ("parentModuleId") REFERENCES "external_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
