import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("permite requisições até o limite", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, { windowMs: 1000, maxRequests: 3 }).allowed).toBe(true);
    }
  });

  it("bloqueia após exceder o limite e informa retryAfterSeconds", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { windowMs: 60_000, maxRequests: 3 });
    }
    const result = checkRateLimit(key, { windowMs: 60_000, maxRequests: 3 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("chaves diferentes têm limites independentes", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    checkRateLimit(keyA, { windowMs: 60_000, maxRequests: 1 });
    const resultA = checkRateLimit(keyA, { windowMs: 60_000, maxRequests: 1 });
    const resultB = checkRateLimit(keyB, { windowMs: 60_000, maxRequests: 1 });
    expect(resultA.allowed).toBe(false);
    expect(resultB.allowed).toBe(true);
  });
});
