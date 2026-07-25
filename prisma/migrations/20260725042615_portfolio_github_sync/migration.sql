-- AlterTable
ALTER TABLE "portfolio_items" ADD COLUMN     "githubDescription" TEXT,
ADD COLUMN     "githubLatestRelease" TEXT,
ADD COLUMN     "githubOpenIssues" INTEGER,
ADD COLUMN     "githubSyncedAt" TIMESTAMP(3);
