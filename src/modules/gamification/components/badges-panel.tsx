import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BadgeIcon } from "./badge-icon";

type BadgeWithStatus = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date | null;
};

export function BadgesPanel({
  badges,
  level,
  totalXp,
  xpIntoLevel,
  xpForNextLevel,
}: {
  badges: BadgeWithStatus[];
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nível {level}</CardTitle>
        <CardDescription>
          {totalXp} XP no total · {xpIntoLevel}/{xpForNextLevel} para o próximo nível
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {badges.map((badge) => {
            const earned = Boolean(badge.earnedAt);
            return (
              <div
                key={badge.id}
                title={badge.description}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center",
                  earned ? "border-primary/40 bg-primary/5" : "border-dashed opacity-50"
                )}
              >
                <BadgeIcon
                  name={badge.icon}
                  className={cn("size-5", earned ? "text-primary" : "text-muted-foreground")}
                />
                <span className="text-[11px] leading-tight font-medium">{badge.name}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
