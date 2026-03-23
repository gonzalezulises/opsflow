# ADR-001: Selección del stack tecnológico

**Estado:** Aceptada
**Fecha:** 2026-03-23

## Contexto

OpsFlow es una herramienta de optimización operacional diseñada para bootcamps de Lean/Six Sigma en Venezuela. Requiere:

- Renderizado server-side para SEO y rendimiento en conexiones lentas
- Base de datos relacional con Row Level Security para multi-tenancy
- UI profesional con componentes accesibles y consistentes
- ORM type-safe para evitar errores en queries complejas de cálculo
- Integración con IA para análisis y recomendaciones
- Despliegue sencillo y económico (Vercel free tier)

Los usuarios operan desde Venezuela, donde la conectividad es variable. El equipo de desarrollo es reducido (1-2 personas), por lo que la productividad del framework es crítica.

## Decisión

Adoptamos el siguiente stack:

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16 |
| Runtime | React | 19 |
| Base de datos | Supabase (PostgreSQL) | - |
| ORM | Drizzle ORM | 0.45+ |
| UI | shadcn/ui + Tailwind CSS v4 | 4 |
| Validación | Zod | v4 |
| IA | OpenAI SDK | 6+ |
| Tablas | TanStack Table | 8 |
| Gráficas | Recharts | 3 |
| Forms | React Hook Form | 7 |

## Consecuencias

### Positivas

- **Next.js App Router** permite Server Components por defecto, reduciendo JS enviado al cliente. Las Server Actions simplifican mutaciones sin API routes.
- **Supabase** provee auth, RLS y realtime out-of-the-box. El tier gratuito es suficiente para MVP.
- **Drizzle** ofrece queries type-safe sin la magia implícita de Prisma. Compatible con el modelo mental SQL que usan los facilitadores.
- **shadcn/ui** da componentes copiados al proyecto (no dependencia externa), con accesibilidad y dark mode incluidos.
- **Zod v4** para validación tanto en cliente como servidor, incluyendo structured outputs de OpenAI.

### Negativas

- Next.js 16 es muy reciente; puede haber breaking changes no documentados en paquetes de terceros.
- Drizzle tiene una comunidad más pequeña que Prisma; menos recursos de aprendizaje.
- Supabase en free tier tiene límites de conexiones y almacenamiento.

### Riesgos mitigados

- Se usa `AGENTS.md` para alertar sobre cambios en Next.js 16.
- Drizzle se limita a queries explícitas (sin magic relations) para mantener claridad.
- Se monitorea uso de Supabase y se planifica upgrade a Pro si el tráfico lo requiere.
