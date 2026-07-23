import { describe, expect, it } from "vitest";
import { distributeWeeksAcrossModules } from "@/modules/curriculum-import/grade-distribution";
import type { ParsedModule } from "@/modules/curriculum-import/grade-parser";

function mockModule(order: number, weight: number): ParsedModule {
  return { order, name: `Módulo ${order}`, weight, topics: [], projectDescription: null };
}

describe("distributeWeeksAcrossModules", () => {
  it("distribui o total exato de semanas, sem perder nem sobrar", () => {
    const modules = [mockModule(0, 15), mockModule(1, 22), mockModule(2, 14), mockModule(3, 13)];
    const ranges = distributeWeeksAcrossModules(104, modules);
    const total = ranges.reduce((sum, r) => sum + r.weekCount, 0);
    expect(total).toBe(104);
  });

  it("dá mais semanas para módulos com mais peso", () => {
    const modules = [mockModule(0, 10), mockModule(1, 40)];
    const ranges = distributeWeeksAcrossModules(50, modules);
    expect(ranges[1].weekCount).toBeGreaterThan(ranges[0].weekCount);
  });

  it("os intervalos de semana são contíguos e não se sobrepõem", () => {
    const modules = [mockModule(0, 5), mockModule(1, 7), mockModule(2, 3)];
    const ranges = distributeWeeksAcrossModules(15, modules);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i].startWeek).toBe(ranges[i - 1].endWeek + 1);
    }
    expect(ranges[0].startWeek).toBe(1);
    expect(ranges[ranges.length - 1].endWeek).toBe(15);
  });

  it("retorna vazio quando não há módulos", () => {
    expect(distributeWeeksAcrossModules(104, [])).toEqual([]);
  });

  it("com pesos próximos, todos os módulos recebem ao menos 1 semana", () => {
    const modules = [mockModule(0, 4), mockModule(1, 4), mockModule(2, 20)];
    const ranges = distributeWeeksAcrossModules(10, modules);
    expect(ranges.every((r) => r.weekCount >= 1)).toBe(true);
  });
});
