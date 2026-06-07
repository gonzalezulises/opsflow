import { defineConfig } from "drizzle-kit";
import "dotenv/config";

/**
 * Prefer `DATABASE_URL_DIRECT` for drizzle-kit (Supabase):
 * transaction pooler (:6543) can make introspection crash with
 * `checkValue.replace` on CHECK constraints — use session/direct (:5432).
 * Runtime (Vercel/server) can keep using a pooler URL in `DATABASE_URL`.
 */
const drizzleDbUrl =
  process.env.DATABASE_URL_DIRECT?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL!;

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: drizzleDbUrl,
  },
});
