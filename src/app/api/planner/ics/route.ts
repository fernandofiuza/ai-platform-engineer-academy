import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { buildPlannerIcs } from "@/modules/planning/ics";
import { formatDayNumber, stripWeekDayPrefix } from "@/modules/planning/format";
import { getLessonSchedule } from "@/modules/planning/queries";

/** Exporta o cronograma dinâmico do Planejador como `.ics` — só as aulas ainda pendentes
 * (agendadas), já que aulas concluídas não fazem sentido como lembrete de calendário. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const schedule = await getLessonSchedule(session.user.id);
  if (!schedule) {
    return NextResponse.json(
      { error: "Configure o Planejador antes de exportar o cronograma." },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const items = schedule.items
    .filter((item) => item.status === "scheduled")
    .map((item) => ({
      lessonId: item.lessonId,
      title: `${formatDayNumber(item.curriculumIndex)} — ${stripWeekDayPrefix(item.title)}`,
      date: item.date,
    }));

  const ics = buildPlannerIcs(items, baseUrl);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cronograma-apea.ics"',
      "Cache-Control": "no-store",
    },
  });
}
