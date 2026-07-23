-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "aiGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "isManuallyEdited" BOOLEAN NOT NULL DEFAULT false;
