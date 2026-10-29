/**
 * Small in-memory limiter for failed sign-ins (per IP + email).
 * Good enough for one server. If the app ever runs on several servers,
 * move this to the database or Redis.
 */
const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

const failures = new Map<string, { count: number; resetAt: number }>();

export function isBlocked(key: string): number {
  const entry = failures.get(key);
  if (!entry) return 0;
  if (Date.now() > entry.resetAt) {
    failures.delete(key);
    return 0;
  }
  return entry.count >= MAX_FAILURES ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 0;
}

export function recordFailure(key: string) {
  const now = Date.now();
  const entry = failures.get(key);
  if (!entry || now > entry.resetAt) {
    failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string) {
  failures.delete(key);
}
