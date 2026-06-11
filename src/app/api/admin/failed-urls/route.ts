import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/auth-guard";
import { deleteUrlFailure, listUrlFailures, setUrlFailureResolved } from "@/server/url-failures";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const params = request.nextUrl.searchParams;
    const q = (params.get("q") ?? "").trim();
    const includeResolved = params.get("includeResolved") === "1";

    const items = await listUrlFailures({ q: q || undefined, includeResolved });
    return NextResponse.json({ items });
  } catch (err) {
    return await handleApiError(err);
  }
}

const bodySchema = z.object({
  id: z.string().min(1),
  action: z.enum(["resolve", "reopen", "delete"]),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return await handleApiError(parsed.error);
    }

    const { id, action } = parsed.data;
    if (action === "delete") {
      await deleteUrlFailure(id);
    } else {
      await setUrlFailureResolved(id, action === "resolve");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return await handleApiError(err);
  }
}
