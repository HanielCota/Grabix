import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

const dbEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL não pode estar vazia."),
});

function getDatabaseUrl(): string {
  const parsed = dbEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`[Grabix] Configuração inválida: ${issue?.message ?? "DATABASE_URL não definida"}`);
  }
  return parsed.data.DATABASE_URL;
}

// Lazy, memoized client. `postgres()` does not open a connection until the
// first query, so importing this module (e.g. during `next build`) is safe
// as long as DATABASE_URL is defined; otherwise it throws at first use.
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const client = postgres(getDatabaseUrl(), { prepare: false });
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export { schema };
