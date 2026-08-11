# Guía de despliegue — OpsFlow

## Requisitos previos

- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [OpenAI](https://platform.openai.com) (para asistencia IA)
- Node.js 20+
- npm 10+

## 1. Configurar Supabase

```bash
# Crear proyecto en Supabase Dashboard
# Obtener las siguientes credenciales del proyecto:
# - Project URL
# - Anon Key
# - Service Role Key
# - Database URL (Settings > Database > Connection string > URI)
```

### Crear tablas

```bash
# Opción A: Push directo del schema
cp .env.example .env
# Editar .env con las credenciales de Supabase
npm run db:push
```

```bash
# Opción B: Generar y aplicar migraciones
npm run db:generate
npm run db:migrate
```

### Seed del caso base

```bash
npm run db:seed
```

### Configurar Auth

En Supabase Dashboard > Authentication > Providers:
1. Habilitar Email (Magic Link)
2. Configurar Site URL: `https://tu-dominio.vercel.app`
3. Agregar redirect URLs:
   - `https://tu-dominio.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (desarrollo)

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completar:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
# LLM primario: DGX Spark (vLLM gemma4 vía Tailscale Funnel + Caddy)
OPENAI_BASE_URL=https://spark-279e.tail0b36db.ts.net/llm-api/v1
OPENAI_API_KEY=<Bearer del Caddy /llm-api>
OPENAI_MODEL=gemma4
# Backup: ChatGPT cloud si Spark falla
OPENAI_BACKUP_API_KEY=sk-...
OPENAI_BACKUP_MODEL=gpt-4o
APP_URL=http://localhost:3000
```

## 3. Desarrollo local

```bash
npm install
npm run dev
# Abrir http://localhost:3000
```

## 4. Desplegar en Vercel

### Opción A: CLI

```bash
npm i -g vercel
vercel login
vercel
# Seguir prompts para vincular/crear proyecto
```

### Opción B: Dashboard

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar repositorio de GitHub
3. Framework preset: Next.js
4. Agregar todas las variables de entorno
5. Deploy

### Variables de entorno en Vercel

En Vercel Dashboard > Settings > Environment Variables, agregar:

| Variable | Entornos |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview |
| `DATABASE_URL` | Production, Preview |
| `OPENAI_BASE_URL` | Production, Preview (Spark Funnel `/llm-api/v1`) |
| `OPENAI_API_KEY` | Production, Preview (Bearer Caddy `/llm-api`) |
| `OPENAI_MODEL` | Production, Preview (`gemma4`) |
| `OPENAI_BACKUP_API_KEY` | Production, Preview (ChatGPT cloud) |
| `OPENAI_BACKUP_MODEL` | Production, Preview (`gpt-4o`) |
| `APP_URL` | Production (URL del dominio) |

## 5. Configurar dominio (opcional)

1. En Vercel Dashboard > Settings > Domains
2. Agregar dominio personalizado
3. Configurar DNS según instrucciones de Vercel
4. Actualizar `APP_URL` en variables de entorno
5. Actualizar Site URL en Supabase Auth

## 6. CI/CD

El repositorio incluye GitHub Actions (`.github/workflows/ci.yml`) que ejecuta:
- Lint
- Typecheck
- Tests
- Build

Se activa automáticamente en push a `main` y en pull requests.

## Checklist post-deploy

- [ ] Login con magic link funciona
- [ ] Caso base visible desde dashboard
- [ ] Módulos del wizard cargan correctamente
- [ ] Build de producción sin errores en Vercel
- [ ] Variables de entorno configuradas
- [ ] Supabase Auth redirect URLs configuradas
- [ ] Seed ejecutado en la base de datos
