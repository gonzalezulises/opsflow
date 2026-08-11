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

// El pooler de Supabase (Supavisor) exige usuario `postgres.<project-ref>`. Si el
// host es el pooler y el usuario es `postgres` a secas, la conexión falla con
// 28P01 "password authentication failed for user postgres" — un error que parece
// contraseña incorrecta pero NO lo es: falta el project-ref en el usuario.
function inspectUrl(raw) {
  try {
    const u = new URL(raw);
    const user = decodeURIComponent(u.username);
    const isPooler = /(^|\.)pooler\.supabase\.com$/.test(u.hostname);
    return {
      user,
      host: u.hostname,
      port: u.port || "(default)",
      isPooler,
      userMissingRef: isPooler && !user.includes("."),
    };
  } catch {
    return null;
  }
}

const info = inspectUrl(url);
if (info) {
  // Resumen sin contraseña, para que el log de CI muestre la estructura usada.
  console.log(JSON.stringify({ using: { user: info.user, host: info.host, port: info.port } }));
  if (info.userMissingRef) {
    console.error(
      JSON.stringify({
        connectionTest: "failed",
        error: "pooler_user_missing_ref",
        message: `El host es el pooler de Supabase pero el usuario es "${info.user}" sin project-ref; Supavisor lo rechazará con 28P01 (parece error de contraseña, pero no lo es).`,
        hint: "El usuario del pooler debe ser postgres.<project-ref> (p.ej. postgres.ensdncbnyynmqwjzidmp). Copia la URI verbatim desde Supabase → Connect → Session pooler y guárdala en el secreto DATABASE_URL_DIRECT.",
      }),
    );
    process.exit(1);
  }
}

const sql = postgres(url, { max: 1, ssl: "require", connect_timeout: 20 });

(async () => {
  try {
    await sql`select 1 as ok`;
    console.log(JSON.stringify({ connectionTest: "ok" }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code =
      e && typeof e === "object" && "code" in e ? String(e.code) : undefined;
    let hint;
    if (/2600:/.test(msg) || /ENETUNREACH/.test(msg)) {
      hint =
        "Desde GitHub Actions suele fallar la conexión Direct si el DNS solo devuelve IPv6. En Supabase → Connect → Session pooler (puerto 5432), copia esa URI y úsala como DATABASE_URL_DIRECT en el secreto del repo.";
    } else if (code === "28P01" || /password authentication failed/i.test(msg)) {
      hint =
        info && info.isPooler
          ? "28P01 contra el pooler: revisa que el usuario sea postgres.<project-ref> (no postgres a secas) y que la contraseña sea la actual. Copia la URI verbatim desde Supabase → Connect → Session pooler."
          : "28P01: usuario o contraseña incorrectos. Verifica la contraseña actual en Supabase → Project Settings → Database y el usuario de la URI. Si la contraseña tiene @ : / # % etc., codifícala con encodeURIComponent solo en el segmento de password.";
    }
    console.error(
      JSON.stringify({
        connectionTest: "failed",
        message: msg,
        code,
        hint,
      }),
    );
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 });
  }
})();
