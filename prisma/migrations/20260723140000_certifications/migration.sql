-- AlterTable
ALTER TABLE "phases" ADD COLUMN     "finalAssessmentId" TEXT,
ADD COLUMN     "finalProjectId" TEXT;

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certifications_code_key" ON "certifications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_userId_phaseId_key" ON "certifications"("userId", "phaseId");

-- CreateIndex
CREATE UNIQUE INDEX "phases_finalProjectId_key" ON "phases"("finalProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "phases_finalAssessmentId_key" ON "phases"("finalAssessmentId");

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_finalProjectId_fkey" FOREIGN KEY ("finalProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_finalAssessmentId_fkey" FOREIGN KEY ("finalAssessmentId") REFERENCES "assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
