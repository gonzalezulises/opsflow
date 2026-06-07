/**
 * Used by GitHub Actions before drizzle-kit push to surface real connection errors.
 * Run: DATABASE_URL_DIRECT=... node scripts/verify-db-connection.cjs
 */
const postgres = require("postgres");

const url =
  process.env.DATABASE_URL_DIRECT?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(
    JSON.stringify({
      connectionTest: "skipped",
      error: "no_url",
      hint: "Set DATABASE_URL_DIRECT (or DATABASE_URL) in the environment",
    }),
  );
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: "require", connect_timeout: 20 });

(async () => {
  try {
    await sql`select 1 as ok`;
    console.log(JSON.stringify({ connectionTest: "ok" }));
  } catch (e) {
    console.error(
      JSON.stringify({
        connectionTest: "failed",
        message: e instanceof Error ? e.message : String(e),
        code: e && typeof e === "object" && "code" in e ? e.code : undefined,
      }),
    );
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
