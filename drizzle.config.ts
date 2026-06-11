import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não carrega .env.local (convenção do Next.js) automaticamente.
// Carregamos .env e .env.local (este sobrescreve) para que os comandos db:* usem
// o DATABASE_URL do ambiente local sem precisar exportá-lo manualmente.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://grabix:grabix@127.0.0.1:5432/grabix",
  },
});
