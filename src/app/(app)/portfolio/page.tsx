import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemDialog } from "@/modules/portfolio/components/add-item-dialog";
import { PortfolioItemCard } from "@/modules/portfolio/components/portfolio-item-card";
import { getPortfolioItems, getProjectOptionsForPortfolio } from "@/modules/portfolio/queries";

export const metadata: Metadata = { title: "Portfólio" };

export default async function PortfolioPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [items, projectOptions] = await Promise.all([
    getPortfolioItems(userId),
    getProjectOptionsForPortfolio(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfólio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Checklist de qualidade dos seus repositórios no GitHub.
          </p>
        </div>
        <AddItemDialog projectOptions={projectOptions} />
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nenhum repositório cadastrado ainda</CardTitle>
            <CardDescription>
              Adicione a URL de um repositório para acompanhar sua qualidade profissional.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <PortfolioItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
