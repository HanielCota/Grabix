import { NextResponse } from "next/server";
import { listSavedAnalyses } from "@/server/analysis-history";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const query = new URL(request.url).searchParams.get("q") ?? undefined;
    return NextResponse.json({ analyses: await listSavedAnalyses(user.id, query) });
  } catch (error) {
    return handleApiError(error);
  }
}
