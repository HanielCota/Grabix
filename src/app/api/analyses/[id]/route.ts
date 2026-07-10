import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteSavedAnalysis, getSavedAnalysis, updateSavedAnalysisSelection } from "@/server/analysis-history";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";

const selectionSchema = z.object({ selectedUrls: z.array(z.string().url()).max(200) });

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const analysis = await getSavedAnalysis(user.id, id);
    return analysis
      ? NextResponse.json(analysis)
      : NextResponse.json({ error: { message: "Análise não encontrada." } }, { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const input = selectionSchema.safeParse(await request.json());
    if (!input.success) return handleApiError(input.error);
    const { id } = await params;
    const selectedUrls = await updateSavedAnalysisSelection(user.id, id, input.data.selectedUrls);
    return selectedUrls
      ? NextResponse.json({ selectedUrls })
      : NextResponse.json({ error: { message: "Análise não encontrada." } }, { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return (await deleteSavedAnalysis(user.id, id))
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json({ error: { message: "Análise não encontrada." } }, { status: 404 });
  } catch (error) {
    return handleApiError(error);
  }
}
