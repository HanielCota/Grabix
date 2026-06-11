import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

// Lazy, memoized client. `postgres()` does not open a connection until the
// first query, so importing this module (e.g. during `next build`) is safe
// even when DATABASE_URL is absent — queries just fail loudly at runtime.
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;
  if (!url) {
    // biome-ignore lint/suspicious/noConsole: operator-facing config warning
    console.warn("[Grabix] DATABASE_URL não definida — operações de banco vão falhar até configurar.");
  }

  const client = postgres(url ?? "postgres://grabix:grabix@127.0.0.1:5432/grabix", { prepare: false });
  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

export { schema };
