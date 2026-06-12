// Backoff with jitter
// Attempt 1 → ~1s  (1000ms base + 0-500ms jitter)
// Attempt 2 → ~5s  (5000ms base + 0-2500ms jitter)
// Attempt 3 → ~25s (25000ms base + 0-12500ms jitter)

const BASE_DELAYS = [1000, 5000, 25000];

export function getRetryDelay(attempt: number): number {
  const base = BASE_DELAYS[Math.min(attempt - 1, BASE_DELAYS.length - 1)];
  const jitter = Math.random() * (base / 2);
  return Math.floor(base + jitter);
}

export function getNextRetryAt(attempt: number): string {
  const delayMs = getRetryDelay(attempt);
  return new Date(Date.now() + delayMs).toISOString();
}
