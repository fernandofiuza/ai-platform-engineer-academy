-- AlterTable
ALTER TABLE "laboratories" ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "isManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lessonId" TEXT;

-- CreateIndex
CREATE INDEX "laboratories_lessonId_idx" ON "laboratories"("lessonId");

-- AddForeignKey
ALTER TABLE "laboratories" ADD CONSTRAINT "laboratories_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
