import type { ParsedModule } from "./grade-parser";

export type ModuleWeekRange = {
  module: ParsedModule;
  weekCount: number;
  startWeek: number;
  endWeek: number;
};

/**
 * Distribui `totalWeeks` proporcionalmente ao peso de cada módulo, usando o método dos maiores
 * restos (largest remainder / método de Hamilton) para garantir que a soma bata exatamente com
 * `totalWeeks` mesmo com arredondamentos. Módulos maiores (mais tópicos) recebem mais semanas.
 */
export function distributeWeeksAcrossModules(
  totalWeeks: number,
  modules: ParsedModule[]
): ModuleWeekRange[] {
  const totalWeight = modules.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight === 0 || modules.length === 0) return [];

  const raw = modules.map((module) => (module.weight / totalWeight) * totalWeeks);
  const floors = raw.map(Math.floor);
  const allocated = floors.reduce((a, b) => a + b, 0);
  const remainder = totalWeeks - allocated;

  const remainders = raw.map((value, index) => ({ index, frac: value - floors[index] }));
  remainders.sort((a, b) => b.frac - a.frac);

  const finalCounts = [...floors];
  for (let i = 0; i < remainder; i++) {
    finalCounts[remainders[i].index] += 1;
  }

  const ranges: ModuleWeekRange[] = [];
  let cursor = 1;
  for (let i = 0; i < modules.length; i++) {
    const weekCount = finalCounts[i];
    const startWeek = cursor;
    const endWeek = cursor + weekCount - 1;
    ranges.push({ module: modules[i], weekCount, startWeek, endWeek });
    cursor = endWeek + 1;
  }

  return ranges;
}
