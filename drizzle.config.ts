import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { z } from "zod";

// drizzle-kit não carrega .env.local (convenção do Next.js) automaticamente.
// Carregamos .env e .env.local (este sobrescreve) para que os comandos db:* usem
// o DATABASE_URL do ambiente local sem precisar exportá-lo manualmente.
config({ path: ".env" });
config({ path: ".env.local", override: true });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória para rodar comandos do drizzle-kit."),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issue = parsed.error.issues[0];
  throw new Error(`[drizzle.config] ${issue?.message ?? "DATABASE_URL não definida"}`);
}

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: parsed.data.DATABASE_URL,
  },
  casing: "snake_case",
  strict: true,
});
