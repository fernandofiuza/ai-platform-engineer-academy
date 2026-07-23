export function computeStreak(sessionDates: Date[]) {
  const uniqueDays = new Set(
    sessionDates.map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Se não estudou hoje, a sequência ainda conta a partir de ontem.
  if (!uniqueDays.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (uniqueDays.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
