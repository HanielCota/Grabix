import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/auth-guard";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { upsertSubscription } from "@/server/entitlements";

const bodySchema = z.object({
  action: z.enum(["grantPro", "revokePro", "setAdmin"]),
  value: z.boolean().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return await handleApiError(parsed.error);
    }

    const db = getDb();
    const found = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!found[0]) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Usuário não encontrado." } }, { status: 404 });
    }

    const { action, value } = parsed.data;
    if (action === "grantPro") {
      await upsertSubscription(id, { plan: "pro", status: "active", provider: "admin", currentPeriodEnd: null });
    } else if (action === "revokePro") {
      await upsertSubscription(id, { plan: "free", status: "inactive", provider: "admin", currentPeriodEnd: null });
    } else if (action === "setAdmin") {
      await db
        .update(users)
        .set({ isAdmin: value === true })
        .where(eq(users.id, id));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return await handleApiError(err);
  }
}
