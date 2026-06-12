import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import * as schema from "./schema";

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

const dbEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL não pode estar vazia."),
});

function isBuildTime(): boolean {
  // Next.js sets NEXT_PHASE during build; skip strict env validation then
  // because routes are imported only to collect static metadata.
  return process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export";
}

function getDatabaseUrl(): string {
  const parsed = dbEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    if (isBuildTime()) {
      // Dummy URL for build-time module evaluation. It is never used to connect
      // because no query runs during `next build`.
      return "postgresql://build:build@localhost:1/build";
    }
    const issue = parsed.error.issues[0];
    throw new Error(`[Grabix] Configuração inválida: ${issue?.message ?? "DATABASE_URL não definida"}`);
  }
  return parsed.data.DATABASE_URL;
}

// Lazy, memoized client. `postgres()` does not open a connection until the
// first query, so importing this module during `next build` is safe.
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const client = postgres(getDatabaseUrl(), { prepare: false });
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export { schema };
