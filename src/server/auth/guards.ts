"use server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import {
  cases,
  processSteps,
  initiatives,
  vsmScenarios,
  caseAssignments,
} from "@/server/db/schema";
import { requireOrganizationContext } from "./context";
import type { OrganizationContext } from "./types";
import { isReadOnlyRole } from "./roles";

type AuthError = { error: string };

export type CaseInOrgSuccess = {
  ctx: OrganizationContext;
  caseFlags: { isTemplate: boolean; participantCanMutate: boolean };
};

/**
 * Verifies the case belongs to the caller's active organization and that
 * participants may only access assigned non-template cases (templates are read-only).
 */
export async function requireCaseInOrganization(
  caseId: string,
): Promise<CaseInOrgSuccess | AuthError> {
  const ctx = await requireOrganizationContext();
  if ("error" in ctx) return ctx;

  const [row] = await db
    .select({
      id: cases.id,
      organizationId: cases.organizationId,
      isTemplate: cases.isTemplate,
    })
    .from(cases)
    .where(and(eq(cases.id, caseId), isNull(cases.deletedAt)));

  if (!row) {
    return { error: "Caso no encontrado." };
  }

  if (row.organizationId !== ctx.organizationId) {
    return { error: "No tienes acceso a este caso." };
  }

  let participantCanMutate = true;
  if (ctx.role === "participant") {
    if (row.isTemplate) {
      participantCanMutate = false;
    } else {
      const [assignment] = await db
        .select({ id: caseAssignments.id })
        .from(caseAssignments)
        .where(
          and(
            eq(caseAssignments.caseId, caseId),
            eq(caseAssignments.userId, ctx.appUserId),
          ),
        )
        .limit(1);

      if (!assignment) {
        return { error: "No tienes acceso a este caso." };
      }
      participantCanMutate = true;
    }
  }

  return {
    ctx,
    caseFlags: {
      isTemplate: row.isTemplate,
      participantCanMutate,
    },
  };
}

export async function requireWritableCase(
  caseId: string,
): Promise<{ ctx: OrganizationContext } | AuthError> {
  const gate = await requireCaseInOrganization(caseId);
  if ("error" in gate) return gate;

  if (isReadOnlyRole(gate.ctx.role)) {
    return { error: "Tu rol es solo lectura. No puedes modificar datos." };
  }

  if (
    gate.ctx.role === "participant" &&
    !gate.caseFlags.participantCanMutate
  ) {
    return { error: "No puedes modificar este caso con tu rol actual." };
  }

  return { ctx: gate.ctx };
}

export async function getCasePermissions(caseId: string): Promise<
  { canMutate: boolean; readOnly: boolean } | AuthError
> {
  const gate = await requireCaseInOrganization(caseId);
  if ("error" in gate) return gate;

  const readOnly = isReadOnlyRole(gate.ctx.role);
  const canMutate =
    !readOnly &&
    (gate.ctx.role !== "participant" || gate.caseFlags.participantCanMutate);

  return { canMutate, readOnly };
}

export async function assertInitiativeInOrganization(
  initiativeId: string,
): Promise<{ caseId: string; ctx: OrganizationContext } | AuthError> {
  const ctx = await requireOrganizationContext();
  if ("error" in ctx) return ctx;

  const [init] = await db
    .select({ caseId: initiatives.caseId })
    .from(initiatives)
    .where(eq(initiatives.id, initiativeId));

  if (!init) return { error: "Iniciativa no encontrada." };

  const caseGate = await requireCaseInOrganization(init.caseId);
  if ("error" in caseGate) return caseGate;

  return { caseId: init.caseId, ctx: caseGate.ctx };
}

export async function assertProcessStepInOrganization(
  stepId: string,
): Promise<{ caseId: string; ctx: OrganizationContext } | AuthError> {
  const ctx = await requireOrganizationContext();
  if ("error" in ctx) return ctx;

  const [step] = await db
    .select({ caseId: processSteps.caseId })
    .from(processSteps)
    .where(eq(processSteps.id, stepId));

  if (!step) return { error: "Paso no encontrado." };

  const caseGate = await requireCaseInOrganization(step.caseId);
  if ("error" in caseGate) return caseGate;

  return { caseId: step.caseId, ctx: caseGate.ctx };
}

export async function assertScenarioInOrganization(
  scenarioId: string,
): Promise<{ caseId: string; ctx: OrganizationContext } | AuthError> {
  const ctx = await requireOrganizationContext();
  if ("error" in ctx) return ctx;

  const [sc] = await db
    .select({ caseId: vsmScenarios.caseId })
    .from(vsmScenarios)
    .where(eq(vsmScenarios.id, scenarioId));

  if (!sc) return { error: "Escenario no encontrado." };

  const caseGate = await requireCaseInOrganization(sc.caseId);
  if ("error" in caseGate) return caseGate;

  return { caseId: sc.caseId, ctx: caseGate.ctx };
}
