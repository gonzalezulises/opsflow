# ADR-002: Modos duales de cálculo (lean_correct vs compatibility)

**Estado:** Aceptada
**Fecha:** 2026-03-23

## Contexto

OpsFlow reemplaza un toolkit de Excel utilizado en bootcamps de Lean/Six Sigma. Este toolkit contiene cálculos conceptualmente incorrectos que los facilitadores han usado durante años. Ejemplo crítico:

- **Excel toolkit:** Cuenta todo el tiempo de proceso como valor agregado (value-add), lo cual infla artificialmente el ratio de valor agregado.
- **Realidad Lean:** Solo el tiempo que transforma el producto/servicio de forma que el cliente pagaría por él es value-add. Inspecciones, retrabajo y esperas internas al proceso NO son value-add.

Los facilitadores necesitan:
1. Resultados correctos según teoría Lean para enseñar bien.
2. Poder comparar con los resultados del Excel para demostrar las diferencias.

## Decisión

Implementar dos modos de cálculo en el motor:

### `lean_correct_mode` (default)

- Clasifica actividades como VA (value-add), NVA (non-value-add) o NNVA (necessary non-value-add) según criterios estrictos.
- Lead time = suma de todos los tiempos (proceso + espera + transporte).
- Process time = solo tiempo de transformación real.
- VA ratio = VA time / Lead time.
- PCE (Process Cycle Efficiency) = VA time / Lead time.

### `compatibility_mode`

- Replica las fórmulas del Excel toolkit.
- Process time = todo el tiempo en la estación (incluyendo inspección, setup).
- VA ratio inflado (como en el Excel).
- Se muestra con un badge "Modo compatibilidad" y una nota explicativa.

### Implementación

```typescript
type CalculationMode = 'lean_correct' | 'compatibility';

// Cada función de cálculo acepta el modo como parámetro
function calculatePCE(steps: ProcessStep[], mode: CalculationMode): number;
```

El modo se configura a nivel de caso (case). El facilitador puede alternar entre ambos modos para comparación didáctica.

## Consecuencias

### Positivas

- Los facilitadores pueden enseñar la diferencia entre cálculos correctos e incorrectos.
- No se rompe la familiaridad con el toolkit existente.
- La comparación lado a lado refuerza el aprendizaje.

### Negativas

- Duplicación parcial de lógica de cálculo.
- Mayor superficie de testing (cada función requiere tests en ambos modos).
- Riesgo de confusión si el usuario no nota en qué modo está.

### Mitigación

- UI muestra prominentemente el modo activo con color diferenciado.
- Cada reporte generado incluye el modo de cálculo usado.
- Tests unitarios cubren ambos modos con fixtures del Excel original.
