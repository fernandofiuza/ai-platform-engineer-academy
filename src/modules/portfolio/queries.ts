import { db } from "@/lib/db";

export async function getPortfolioItems(userId: string) {
  return db.portfolioItem.findMany({
    where: { userId },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectOptionsForPortfolio() {
  return db.project.findMany({ select: { id: true, title: true } });
}
