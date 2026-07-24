-- CreateTable
CREATE TABLE "laboratory_lessons" (
    "laboratoryId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laboratory_lessons_pkey" PRIMARY KEY ("laboratoryId","lessonId")
);

-- CreateIndex
CREATE INDEX "laboratory_lessons_lessonId_idx" ON "laboratory_lessons"("lessonId");

-- AddForeignKey
ALTER TABLE "laboratory_lessons" ADD CONSTRAINT "laboratory_lessons_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "laboratories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "laboratory_lessons" ADD CONSTRAINT "laboratory_lessons_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: preserve existing single lessonId links as rows in the new join table
INSERT INTO "laboratory_lessons" ("laboratoryId", "lessonId")
SELECT "id", "lessonId" FROM "laboratories" WHERE "lessonId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "laboratories" DROP CONSTRAINT "laboratories_lessonId_fkey";

-- DropIndex
DROP INDEX "laboratories_lessonId_idx";

-- AlterTable
ALTER TABLE "laboratories" DROP COLUMN "lessonId",
ADD COLUMN     "scenario" TEXT;
