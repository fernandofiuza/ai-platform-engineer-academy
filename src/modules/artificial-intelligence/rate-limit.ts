import { checkRateLimit as checkRateLimitGeneric } from "@/lib/rate-limit";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

export function checkRateLimit(userId: string) {
  return checkRateLimitGeneric(`ai:${userId}`, {
    windowMs: WINDOW_MS,
    maxRequests: MAX_REQUESTS_PER_WINDOW,
  });
}
