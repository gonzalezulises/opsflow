import { z } from "zod";
import type { PrioritizationWeights } from "@/lib/calculations/prioritization";
import { DEFAULT_WEIGHTS } from "@/lib/calculations/prioritization";

export const orgPreferencesSchema = z.object({
  defaultVsmMode: z.enum(["lean_correct", "compatibility"]).optional(),
  defaultPrioritizationWeights: z
    .object({
      impactLeadTime: z.number().min(0).max(1),
      impactEconomic: z.number().min(0).max(1),
      impactResilience: z.number().min(0).max(1),
      feasibility30d: z.number().min(0).max(1),
      effort: z.number().min(0).max(1),
      externalDependency: z.number().min(0).max(1),
    })
    .optional(),
});

export type OrgPreferences = z.infer<typeof orgPreferencesSchema>;

const SUM_TOLERANCE = 0.02;

export function parseOrgSettingsJson(raw: unknown): OrgPreferences {
  if (!raw || typeof raw !== "object") return {};
  const parsed = orgPreferencesSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function mergeOrgSettings(
  existing: unknown,
  patch: OrgPreferences,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  const currentPrefs = parseOrgSettingsJson(base);
  const next: Record<string, unknown> = { ...base };

  if (patch.defaultVsmMode !== undefined) {
    next.defaultVsmMode = patch.defaultVsmMode;
  } else if (currentPrefs.defaultVsmMode !== undefined) {
    next.defaultVsmMode = currentPrefs.defaultVsmMode;
  }

  if (patch.defaultPrioritizationWeights !== undefined) {
    next.defaultPrioritizationWeights = patch.defaultPrioritizationWeights;
  } else if (currentPrefs.defaultPrioritizationWeights !== undefined) {
    next.defaultPrioritizationWeights = currentPrefs.defaultPrioritizationWeights;
  }

  return next;
}

export function assertWeightsSumOne(w: PrioritizationWeights): string | null {
  const sum =
    w.impactLeadTime +
    w.impactEconomic +
    w.impactResilience +
    w.feasibility30d +
    w.effort +
    w.externalDependency;
  if (Math.abs(sum - 1) > SUM_TOLERANCE) {
    return `Los pesos deben sumar 1.00 (actual: ${sum.toFixed(2)}).`;
  }
  return null;
}

export function weightsFromForm(
  data: z.infer<typeof orgPreferencesSchema>["defaultPrioritizationWeights"],
): PrioritizationWeights {
  if (!data) return DEFAULT_WEIGHTS;
  return {
    impactLeadTime: data.impactLeadTime,
    impactEconomic: data.impactEconomic,
    impactResilience: data.impactResilience,
    feasibility30d: data.feasibility30d,
    effort: data.effort,
    externalDependency: data.externalDependency,
  };
}
