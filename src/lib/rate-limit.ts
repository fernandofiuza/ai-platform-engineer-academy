// Rate limit em memória, por chave (userId, IP, etc.) — suficiente para uma instância única
// (MVP). Se o app rodar com múltiplas instâncias em produção, precisa migrar para um store
// compartilhado (Redis). Ver docs/DECISIONS.md.
const requestLog = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  { windowMs, maxRequests }: { windowMs: number; maxRequests: number }
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { allowed: true };
}
