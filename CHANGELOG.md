# Changelog

## [0.1.0] - 2026-03-23

### Added
- Scaffold inicial del proyecto con Next.js 16, TypeScript, Tailwind v4, shadcn/ui
- Modelo de datos completo con Drizzle ORM (17 tablas, 5 enums)
- Autenticación con Supabase Auth (magic link)
- Middleware de sesión y protección de rutas
- Layout con sidebar navegable
- Landing page pública
- Dashboard con métricas y acceso rápido
- Módulo de contexto del caso (formulario de empresa y métricas base)
- Módulo de diagnóstico de madurez (15 preguntas, escala 1-5, resumen visual)
- Módulo VSM con tabla editable y toggle lean_correct/compatibility
- Módulo de riesgo contextual con matriz editable y ranking
- Módulo de costo de desperdicio con cálculos automáticos
- Módulo de priorización con pesos configurables
- Módulo de plan de 30 días con tabla de acciones
- Módulo de seguimiento semanal con alertas de tendencia
- Reporte ejecutivo consolidado
- Motor de cálculos: diagnóstico, VSM (dual mode), riesgos, desperdicio, priorización, tracking
- Integración IA con OpenAI structured outputs (8 tipos de análisis)
- Panel lateral de asistencia IA por módulo
- Schemas Zod para todas las salidas de IA
- Protección contra prompt injection
- Server actions para todos los módulos (CRUD completo)
- Seed del caso base "Alimentos Santa Emilia, C.A."
- Tests unitarios para todos los módulos de cálculo
- CI con GitHub Actions (lint, typecheck, test, build)
- Documentación: README, ARCHITECTURE, ADRs, AI_DESIGN, SECURITY, DATA_MODEL, PRODUCT_SCOPE, DEPLOY, TESTING
- Página de configuración (pesos, modo de cálculo)
- Página de gestión de equipo
