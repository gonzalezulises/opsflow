# Testing — OpsFlow

## Stack de testing

- **Unit/Integration**: Vitest
- **E2E**: Playwright (pendiente de configurar)
- **Cobertura**: módulo de cálculos completamente testeado

## Ejecutar tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch
```

## Estructura de tests

```
src/lib/calculations/__tests__/
├── diagnostic.test.ts    # Cálculos de diagnóstico de madurez
├── vsm.test.ts          # Cálculos VSM (ambos modos)
├── risk.test.ts         # Cálculos de riesgo contextual
├── waste.test.ts        # Cálculos de costo de desperdicio
├── prioritization.test.ts # Cálculos de priorización
└── tracking.test.ts     # Detección de tendencias
```

## Qué se testea

### Cálculos de diagnóstico
- Scores vacíos
- Todos los niveles: bajo (<2.5), medio (2.5-3.8), alto (>=3.8)
- Caso base del toolkit
- Filtrado de scores inválidos

### VSM
- Modo lean_correct (default): solo cuenta pasos con valor
- Modo compatibility: cuenta todo el tiempo de proceso
- Lead time, eficiencia de flujo, retrabajo promedio
- Caso base con los 6 pasos del toolkit

### Riesgos
- Cálculo de exposición (prob × impacto)
- Ranking por exposición, desempate por impacto
- Niveles de riesgo: low, medium, high, critical

### Desperdicio
- Fórmula de costo laboral mensual
- Fórmula de margen perdido
- Ranking por costo total

### Priorización
- Score ponderado con pesos configurables
- Clasificación: Atacar ya (>=4.0), Diseñar (>=3.2), Postergar
- Inversión de esfuerzo y dependencia externa

### Seguimiento
- Detección de 2+ semanas de deterioro
- Métricas donde higher-is-better vs lower-is-better
- Datos insuficientes (menos de 2 semanas)

## E2E tests (pendiente)

Flujos críticos planificados:
1. Login con magic link
2. Crear caso desde template
3. Completar diagnóstico
4. Crear VSM con 6 pasos
5. Registrar riesgos
6. Calcular desperdicio
7. Priorizar iniciativas
8. Generar plan 30 días
9. Cargar seguimiento semanal
10. Ver reporte ejecutivo
