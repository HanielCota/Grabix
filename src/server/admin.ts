import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";

// Super-admins defined by env (cannot be removed via the UI). Plus per-user
// `isAdmin` flags in the DB (promotable from the dashboard).
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEnvAdmin(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export async function isAdmin(userId: string, email?: string | null): Promise<boolean> {
  if (isEnvAdmin(email)) return true;
  const rows = await getDb().select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.isAdmin === true;
}
