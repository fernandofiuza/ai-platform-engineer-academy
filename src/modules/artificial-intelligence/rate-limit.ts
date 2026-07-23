// Rate limit em memória, por usuário — suficiente para uma instância única (MVP). Se o app rodar
// com múltiplas instâncias em produção, isso precisa migrar para um store compartilhado (Redis).
const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

const requestLog = new Map<string, number[]>();

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return { allowed: true };
}
