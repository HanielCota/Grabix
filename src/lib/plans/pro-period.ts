// Helpers for reasoning about the Pro pass window (period end). Kept separate so
// the account card and the expiry banner agree on what "days left" means.

const DAY_MS = 86_400_000;

/**
 * Whole days remaining on the Pro pass (rounded up), or null when there is no
 * expiry (lifetime grant / free) or the pass has already lapsed.
 */
export function proDaysLeft(periodEnd?: string | null): number | null {
  if (!periodEnd) return null;
  const end = new Date(periodEnd).getTime();
  if (Number.isNaN(end)) return null;
  const remaining = end - Date.now();
  if (remaining <= 0) return null;
  return Math.ceil(remaining / DAY_MS);
}
