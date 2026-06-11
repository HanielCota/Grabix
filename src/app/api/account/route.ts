import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";

// Permanently delete the signed-in user's account. The FK cascades remove their
// accounts, sessions, subscription and usage rows; url_failure.lastUserId is set
// null. The client signs out afterwards (JWT session is stateless).
export async function DELETE() {
  try {
    const user = await requireUser();
    await getDb().delete(users).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return await handleApiError(err);
  }
}
