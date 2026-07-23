import { describe, expect, it } from "vitest";
import { computeStreak } from "@/modules/study-sessions/streak";

function daysAgo(n: number) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

describe("computeStreak", () => {
  it("retorna 0 quando não há sessões", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("conta dias consecutivos terminando hoje", () => {
    const sessions = [daysAgo(0), daysAgo(1), daysAgo(2)];
    expect(computeStreak(sessions)).toBe(3);
  });

  it("ainda conta a sequência se o último estudo foi ontem (não estudou hoje)", () => {
    const sessions = [daysAgo(1), daysAgo(2), daysAgo(3)];
    expect(computeStreak(sessions)).toBe(3);
  });

  it("quebra a sequência quando há um dia sem sessão no meio", () => {
    const sessions = [daysAgo(0), daysAgo(2)];
    expect(computeStreak(sessions)).toBe(1);
  });

  it("é 0 se o último estudo foi há mais de um dia", () => {
    const sessions = [daysAgo(3), daysAgo(4)];
    expect(computeStreak(sessions)).toBe(0);
  });

  it("múltiplas sessões no mesmo dia contam como um único dia", () => {
    const sessions = [daysAgo(0), daysAgo(0), daysAgo(1)];
    expect(computeStreak(sessions)).toBe(2);
  });
});
