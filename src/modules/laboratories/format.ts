import { extractModuleName } from "@/modules/curriculum/module-name";

type LinkedLesson = {
  lesson: {
    week: {
      number: number;
      title: string;
      phase: { label: string } | null;
    };
  };
};

/** Descreve a que matéria(s) um laboratório se refere, pelo nome do módulo (ex.: "Docker",
 * "Linux") em vez do número da semana — mais legível para o aluno do que "Semana 58-61". Se o
 * laboratório cruzar mais de um módulo, lista todos, separados por vírgula. */
export function describeLinkedWeeks(lessons: LinkedLesson[]): string | null {
  if (lessons.length === 0) return null;

  const moduleNames = [...new Set(lessons.map((l) => extractModuleName(l.lesson.week.title)))];
  const phase = lessons[0].lesson.week.phase?.label;
  const modulesLabel = moduleNames.join(", ");

  return phase ? `${modulesLabel} (${phase})` : modulesLabel;
}
