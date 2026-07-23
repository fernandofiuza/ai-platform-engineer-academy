-- CreateTable
CREATE TABLE "code_reviews" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "feedback" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "code_reviews_submissionId_idx" ON "code_reviews"("submissionId");

-- AddForeignKey
ALTER TABLE "code_reviews" ADD CONSTRAINT "code_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "project_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
