import type { Metadata } from "next";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { formatScheduleDate } from "@/modules/planning/format";
import { ACTIVITY_ICONS, formatActivityLine } from "@/modules/study-hub/activity-labels";
import { getActivityHistory } from "@/modules/study-hub/activity";

export const metadata: Metadata = { title: "Histórico · Study Hub" };

function dayLabel(date: Date, today: Date) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return formatScheduleDate(date, "long");
}

export default async function StudyHubHistoryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const entries = await getActivityHistory(userId);
  const today = new Date();

  const groups: { label: string; items: typeof entries }[] = [];
  for (const entry of entries) {
    const label = dayLabel(entry.createdAt, today);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.label === label) {
      lastGroup.items.push(entry);
    } else {
      groups.push({ label, items: [entry] });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tudo o que você fez no APEX e nos seus cursos externos, em ordem.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <h2 className="text-sm font-medium text-muted-foreground">{group.label}</h2>
            <div className="mt-2 divide-y rounded-lg border">
              {group.items.map((entry) => {
                const Icon = ACTIVITY_ICONS[entry.type];
                const line = formatActivityLine(entry.type, entry.title, entry.metadata);
                const time = entry.createdAt.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const content = (
                  <div className="flex items-center gap-3 px-4 py-3">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">{line}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
                  </div>
                );
                return entry.href ? (
                  <Link key={entry.id} href={entry.href} className="block hover:bg-muted/50">
                    {content}
                  </Link>
                ) : (
                  <div key={entry.id}>{content}</div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
