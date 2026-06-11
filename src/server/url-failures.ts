import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { urlFailures } from "@/server/db/schema";

// Only reasons that point at a site/extraction problem are worth surfacing.
// User-side errors (auth, quota, validation, SSRF block, upgrade-gating) are not
// actionable for improving extraction, so they're never recorded.
const ACTIONABLE_REASONS = new Set([
  "FETCH_FAILED", // couldn't fetch the page (404/403/timeout/network)
  "NOT_HTML", // response wasn't an HTML page
  "HTML_TOO_LARGE", // page exceeded the size limit
  "NO_MEDIA", // page loaded but no media was extracted
  "CRAWL_ERROR", // deep crawl blew up
  "INTERNAL_ERROR", // unexpected server error on this URL
]);

export function isActionableFailure(reason: string): boolean {
  return ACTIONABLE_REASONS.has(reason);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "—";
  }
}

export interface RecordUrlFailureInput {
  url: string;
  reason: string;
  message?: string | null;
  deepCrawl?: boolean;
  userId?: string | null;
}

/** Best-effort: record (or bump) a failed extraction. Never throws to the caller. */
export async function recordUrlFailure(input: RecordUrlFailureInput): Promise<void> {
  if (!input.url || !isActionableFailure(input.reason)) return;

  try {
    const db = getDb();
    const values = {
      url: input.url.slice(0, 2048),
      host: hostOf(input.url),
      reason: input.reason,
      message: input.message?.slice(0, 500) ?? null,
      deepCrawl: input.deepCrawl ?? false,
      lastUserId: input.userId ?? null,
    };

    await db
      .insert(urlFailures)
      .values(values)
      .onConflictDoUpdate({
        target: [urlFailures.url, urlFailures.reason],
        set: {
          count: sql`${urlFailures.count} + 1`,
          message: values.message,
          deepCrawl: values.deepCrawl,
          lastUserId: values.lastUserId,
          resolved: false, // a fresh occurrence re-opens a previously resolved row
          lastSeenAt: new Date(),
        },
      });
  } catch {
    // Telemetry is best-effort — never break the user's request because of it.
  }
}

export async function listUrlFailures(opts: { q?: string; includeResolved?: boolean }) {
  const db = getDb();
  const conds = [];
  if (!opts.includeResolved) conds.push(eq(urlFailures.resolved, false));
  if (opts.q) {
    conds.push(or(ilike(urlFailures.url, `%${opts.q}%`), ilike(urlFailures.host, `%${opts.q}%`)));
  }
  return db
    .select()
    .from(urlFailures)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(urlFailures.lastSeenAt))
    .limit(200);
}

export async function setUrlFailureResolved(id: string, resolved: boolean): Promise<void> {
  await getDb().update(urlFailures).set({ resolved }).where(eq(urlFailures.id, id));
}

export async function deleteUrlFailure(id: string): Promise<void> {
  await getDb().delete(urlFailures).where(eq(urlFailures.id, id));
}
