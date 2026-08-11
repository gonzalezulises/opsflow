# Google OAuth / SSO (evolución desde magic link)

OpsFlow usa hoy **magic link** (Supabase Auth por correo). Para añadir **Google OAuth** sin romper multi-tenant:

## 1. Google Cloud Console

- Proyecto → **APIs & Services** → **Credentials** → **Create credentials** → OAuth client ID → **Web application**.
- **Authorized redirect URIs:** copia la URL que muestra Supabase para Google (incluye `/auth/v1/callback` del proyecto Supabase).
- **OAuth consent screen:** tipo *External* o *Internal* según dominio; scopes mínimos `email`, `profile`, `openid`.

## 2. Supabase Dashboard

- **Authentication → Providers → Google:** activar, pegar **Client ID** y **Client secret**.
- Revisar **Authentication → URL configuration**: Site URL = `APP_URL` de producción; redirect URLs incluyen `APP_URL/auth/callback` si aplica vuestro flujo Next.

## 3. App Next (`@supabase/ssr`)

- En la pantalla de login, botón que ejecute `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback` } })` (ajustar ruta al callback real del repo: `src/app/auth/callback/route.ts`).
- El callback existente debe seguir intercambiando el código por sesión como con magic link.

## 4. Multi-tenant

- El **email** devuelto por Google debe alinearse con **invitaciones** y filas en **`organization_members`** (igual que magic link). No hace falta un proveedor distinto por org en la primera iteración.
- Si usáis `OPSFLOW_STRICT_TENANCY`, un usuario nuevo vía Google sin membresía debe caer en el mismo flujo que sin org (`/pending-access`, invitación, etc.).

## 5. Variables (opcional)

- No son estrictamente obligatorias si todo vive en el panel de Supabase; podéis añadir flags de producto (`NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`) si queréis mostrar el botón solo cuando el proveedor esté activo en Supabase.

Documentación oficial: [Supabase Auth — Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google).
