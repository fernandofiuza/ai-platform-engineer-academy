-- CreateEnum
CREATE TYPE "ExternalCourseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "NoteScope" ADD VALUE 'EXTERNAL_LESSON';

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "externalLessonId" TEXT;

-- CreateTable
CREATE TABLE "lesson_review_marks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_review_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_courses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "platform" TEXT,
    "instructor" TEXT,
    "url" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "status" "ExternalCourseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "external_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "markedForReview" BOOLEAN NOT NULL DEFAULT false,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_review_marks_userId_lessonId_key" ON "lesson_review_marks"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "external_courses_userId_idx" ON "external_courses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "external_modules_courseId_order_key" ON "external_modules"("courseId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "external_lessons_moduleId_order_key" ON "external_lessons"("moduleId", "order");

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_externalLessonId_fkey" FOREIGN KEY ("externalLessonId") REFERENCES "external_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_review_marks" ADD CONSTRAINT "lesson_review_marks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_review_marks" ADD CONSTRAINT "lesson_review_marks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_courses" ADD CONSTRAINT "external_courses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_modules" ADD CONSTRAINT "external_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "external_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_lessons" ADD CONSTRAINT "external_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "external_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
