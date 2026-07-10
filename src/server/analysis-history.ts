import { and, desc, eq, ilike, or } from "drizzle-orm";
import { type AnalyzePageResult, analyzePageResultSchema } from "@/features/media-downloader/domain/types";
import { getDb } from "@/server/db";
import { savedAnalyses } from "@/server/db/schema";

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function parseSelectedUrls(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function saveCompletedAnalysis(userId: string, result: AnalyzePageResult, deepCrawl: boolean) {
  const imageCount = result.assets.filter((asset) => asset.type === "IMAGE").length;
  const videoCount = result.assets.length - imageCount;
  const [saved] = await getDb()
    .insert(savedAnalyses)
    .values({
      userId,
      sourceUrl: result.url,
      domain: domainFromUrl(result.url),
      deepCrawl,
      totalFound: result.totalFound,
      imageCount,
      videoCount,
      pagesScanned: result.pagesScanned,
      lockedCount: result.lockedCount ?? 0,
      assets: JSON.stringify(result.assets),
    })
    .returning({ id: savedAnalyses.id });
  return saved;
}

export async function listSavedAnalyses(userId: string, query?: string) {
  const search = query?.trim();
  const where = search
    ? and(
        eq(savedAnalyses.userId, userId),
        or(ilike(savedAnalyses.domain, `%${search}%`), ilike(savedAnalyses.sourceUrl, `%${search}%`)),
      )
    : eq(savedAnalyses.userId, userId);
  const rows = await getDb().select().from(savedAnalyses).where(where).orderBy(desc(savedAnalyses.updatedAt)).limit(50);
  return rows.map((row) => ({ ...row, selectedCount: parseSelectedUrls(row.selectedUrls).length }));
}

export async function getSavedAnalysis(userId: string, id: string) {
  const [row] = await getDb()
    .select()
    .from(savedAnalyses)
    .where(and(eq(savedAnalyses.id, id), eq(savedAnalyses.userId, userId)))
    .limit(1);
  if (!row) return null;
  try {
    const assets = JSON.parse(row.assets);
    const result = analyzePageResultSchema.safeParse({
      url: row.sourceUrl,
      totalFound: row.totalFound,
      assets,
      pagesScanned: row.pagesScanned ?? undefined,
      lockedCount: row.lockedCount || undefined,
    });
    if (!result.success) return null;
    return { ...row, result: result.data, selectedUrls: parseSelectedUrls(row.selectedUrls) };
  } catch {
    return null;
  }
}

export async function updateSavedAnalysisSelection(userId: string, id: string, selectedUrls: string[]) {
  const allowed = new Set(selectedUrls);
  const analysis = await getSavedAnalysis(userId, id);
  if (!analysis) return null;
  const verified = analysis.result.assets.map((asset) => asset.url).filter((url) => allowed.has(url));
  const [updated] = await getDb()
    .update(savedAnalyses)
    .set({ selectedUrls: JSON.stringify(verified), updatedAt: new Date() })
    .where(and(eq(savedAnalyses.id, id), eq(savedAnalyses.userId, userId)))
    .returning({ id: savedAnalyses.id, selectedUrls: savedAnalyses.selectedUrls });
  return updated ? parseSelectedUrls(updated.selectedUrls) : null;
}

export async function deleteSavedAnalysis(userId: string, id: string) {
  const deleted = await getDb()
    .delete(savedAnalyses)
    .where(and(eq(savedAnalyses.id, id), eq(savedAnalyses.userId, userId)))
    .returning({ id: savedAnalyses.id });
  return deleted.length > 0;
}
