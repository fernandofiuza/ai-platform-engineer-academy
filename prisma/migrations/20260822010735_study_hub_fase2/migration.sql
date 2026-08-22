-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LESSON_COMPLETED', 'LESSON_REOPENED', 'SESSION_FINISHED', 'LESSON_MARKED_REVIEW', 'LESSON_UNMARKED_REVIEW', 'COURSE_STARTED', 'COURSE_COMPLETED');

-- CreateTable
CREATE TABLE "activity_log_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "href" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_log_entries_userId_createdAt_idx" ON "activity_log_entries"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "activity_log_entries" ADD CONSTRAINT "activity_log_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
