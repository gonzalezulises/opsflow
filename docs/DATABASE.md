# Base de datos (Drizzle + Supabase)

## `drizzle-kit push`

- Configuración en `drizzle.config.ts`: solo esquema **`public`** y URL de introspección
  `DATABASE_URL_DIRECT` / `DIRECT_URL` / `DATABASE_URL` (en ese orden).
- **Supabase:** el *transaction pooler* (puerto **6543**) suele provocar fallos de introspección en
  `drizzle-kit push` (`checkValue.replace` sobre `undefined`). Usa conexión **directa o session**
  (puerto **5432**) para migraciones/push.
- En **Vercel** (runtime de la app): suele bastar con **`DATABASE_URL`** al pooler **6543** (o el que use Supabase). **No** hace falta definir `DATABASE_URL_DIRECT` en Vercel salvo que el *build* o un script de deploy ejecute `npm run db:push` ahí (poco habitual).
- En **GitHub Actions**: el workflow **Drizzle DB push** (`.github/workflows/db-push.yml`) solo inyecta secretos en el job de `db:push`, no en el resto de CI. Antes de `drizzle-kit push` ejecuta **`scripts/verify-db-connection.cjs`** para dejar en el log un JSON claro si falla TLS o la red.

### GitHub Actions — secreto solo para `db:push`

1. Supabase → **Project Settings → Database** (o **Connect** en el header) → elige **Session pooler** (puerto **5432**), no *Transaction pooler* (6543). Para **GitHub Actions** suele ser más fiable que **Direct** porque el runner a menudo **no tiene ruta IPv6** hacia el host “directo” de Supabase (error `ENETUNREACH` a `2600:…`). La app en **Vercel** puede seguir usando **Transaction pooler** en `DATABASE_URL`.
2. Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**
   - Nombre: **`DATABASE_URL_DIRECT`**
   - Valor: la URI completa que muestre **Connect → Session pooler** (puerto **5432**), **sin editar**. En el *pooler* (Supavisor) el usuario debe ser **`postgres.<project-ref>`** (el ref es el subdominio de `https://<ref>.supabase.co`), **no** solo `postgres`. Si pegás la plantilla de *Direct* (`db.<ref>.supabase.co` con usuario `postgres`) o cambiáis el usuario a mano contra `*.pooler.supabase.com`, Postgres suele responder **`28P01` / password authentication failed** aunque la contraseña sea correcta: el mensaje engaña.
   - Ejemplo de forma: `postgresql://postgres.[ref]:[PASSWORD]@aws-0-....pooler.supabase.com:5432/postgres`
3. **Actions** → **Drizzle DB push** → **Run workflow** → en *confirm* escribe exactamente **`push`** → Run workflow.

Si preferís el nombre `DIRECT_URL`, podéis crear ese secreto en su lugar; `drizzle.config.ts` lo acepta en segundo lugar.

El CI normal (`.github/workflows/ci.yml`) **no** ejecuta `db:push` ni necesita estos secretos.

### Error `28P01 password authentication failed for user "postgres"`

Es el fallo más confuso: **parece** contraseña incorrecta, pero casi siempre es el **usuario mal formado**. El pooler de Supabase (Supavisor) exige que el usuario sea `postgres.<project-ref>`, no `postgres` a secas.

- Si el secreto apunta al **pooler** (`...pooler.supabase.com`) con usuario `postgres` (sin el `.ref`), Supavisor responde `28P01` aunque la contraseña sea correcta. El mensaje dice `user "postgres"`, lo que confirma que falta el ref.
- Como `28P01` es rechazo de autenticación (no de red), GitHub **sí** llegó al servidor: el problema está en la URI, no en la conectividad.
- **Fix:** copia la URI verbatim desde Supabase → Connect → **Session pooler** (ya trae el usuario `postgres.<project-ref>`) y pégala en el secreto sin editarla a mano. El paso `Verify Postgres connection` ahora detecta este caso y lo marca en el log como `error: "pooler_user_missing_ref"` antes incluso de intentar conectar.
- Solo si el usuario **ya** lleva el ref y aun así da `28P01`, entonces sí revisa la contraseña en Supabase → Project Settings → Database.
- Si el host es **`db.<ref>.supabase.co`** (Direct), entonces sí suele ser contraseña incorrecta o password con caracteres reservados sin URL-encode en la URI.

### Si el job falla en “Pulling schema”

- Si el paso **Verify Postgres connection** muestra `ENETUNREACH` con una IP **IPv6** (`2600:...`), el runner de GitHub no llega por IPv6. El workflow define `NODE_OPTIONS=--dns-result-order=ipv4first`, pero si el hostname solo tiene IPv6, **sustituye el secreto `DATABASE_URL_DIRECT` por la URI de Session pooler (5432)** de Supabase (Connect → Session pooler). La app en Vercel puede seguir con Transaction pooler (6543) en `DATABASE_URL`.
- Asegura que la URI lleve **`?sslmode=require`** (o equivalente) si Supabase lo exige desde IPs de GitHub Actions.
- En **Supabase → Database → Network restrictions**: si tenéis allowlist de IP, hay que permitir los rangos de **GitHub-hosted runners** o usar **Session pooler** (5432) como alternativa a *Direct* desde redes IPv4, según indique el panel de Supabase.
- Si sigue el error `checkValue.replace` con introspection, seguid usando **`docs/sql/*.sql`** hasta que Drizzle lo corrija; el workflow no sustituye ese caso extremo.

## SQL manual

Los scripts en `docs/sql/` complementan `push` cuando haga falta aplicar DDL idempotente en prod
sin pasar por Drizzle.

## Comandos

| Comando | Uso |
|---------|-----|
| `npm run db:push` | Alinear esquema remoto con `src/server/db/schema.ts` |
| `npm run db:generate` | Generar migraciones SQL versionadas |
| `npm run db:migrate` | Aplicar migraciones (cuando uséis flujo por archivos) |
| `npm run db:seed` | Seed local / controlado |
