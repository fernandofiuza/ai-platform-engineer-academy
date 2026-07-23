import { describe, expect, it } from "vitest";
import { computeNextReview } from "@/modules/flashcards/sm2";

describe("computeNextReview (SM-2 simplificado)", () => {
  it("primeira revisão com boa qualidade agenda para o dia seguinte", () => {
    const result = computeNextReview(5, null);
    expect(result.intervalDays).toBe(1);
  });

  it("qualidade baixa (< 3) reseta o intervalo para 1 dia mesmo com histórico", () => {
    const previous = { intervalDays: 30, easeFactor: 2.6, reviewCount: 4 };
    const result = computeNextReview(1, previous);
    expect(result.intervalDays).toBe(1);
  });

  it("segunda revisão boa avança para 6 dias", () => {
    const previous = { intervalDays: 1, easeFactor: 2.5, reviewCount: 1 };
    const result = computeNextReview(4, previous);
    expect(result.intervalDays).toBe(6);
  });

  it("revisões consecutivas boas aumentam o intervalo multiplicando pelo fator de facilidade", () => {
    const previous = { intervalDays: 6, easeFactor: 2.5, reviewCount: 2 };
    const result = computeNextReview(5, previous);
    expect(result.intervalDays).toBeGreaterThan(6);
    expect(result.intervalDays).toBe(Math.round(6 * result.easeFactor));
  });

  it("fator de facilidade nunca fica abaixo de 1.3", () => {
    let state = null as null | { intervalDays: number; easeFactor: number; reviewCount: number };
    for (let i = 0; i < 10; i++) {
      const result = computeNextReview(0, state);
      state = { ...result, reviewCount: (state?.reviewCount ?? 0) + 1 };
    }
    expect(state!.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("nextReviewAt fica no futuro, coerente com intervalDays", () => {
    const before = Date.now();
    const result = computeNextReview(5, null);
    const diffDays = (result.nextReviewAt.getTime() - before) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(0.9);
    expect(diffDays).toBeLessThan(1.1);
  });
});
