type LinkedLesson = {
  lesson: {
    week: {
      number: number;
      phase: { label: string } | null;
    };
  };
};

export function describeLinkedWeeks(lessons: LinkedLesson[]): string | null {
  if (lessons.length === 0) return null;

  const weekNumbers = [...new Set(lessons.map((l) => l.lesson.week.number))].sort((a, b) => a - b);
  const phase = lessons[0].lesson.week.phase?.label;
  const weekLabel =
    weekNumbers.length === 1
      ? `Semana ${weekNumbers[0]}`
      : `Semanas ${weekNumbers[0]}–${weekNumbers[weekNumbers.length - 1]}`;

  return phase ? `${weekLabel}, ${phase}` : weekLabel;
}
