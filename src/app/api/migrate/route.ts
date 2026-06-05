import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { guardAdminApiRoute } from "@/server/lib/admin-api-route";

export async function GET(request: Request) {
  const denied = guardAdminApiRoute(request);
  if (denied) return denied;

  try {
    // Check if vsm_state enum already exists
    const enumCheck = await db.execute(
      sql`SELECT 1 FROM pg_type WHERE typname = 'vsm_state'`
    );

    if ((enumCheck as unknown as unknown[]).length === 0) {
      await db.execute(
        sql`CREATE TYPE "public"."vsm_state" AS ENUM('current', 'future')`
      );
    }

    // Check if columns already exist
    const colCheck = await db.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'process_steps' AND column_name = 'vsm_state'`
    );

    if ((colCheck as unknown as unknown[]).length === 0) {
      await db.execute(
        sql`ALTER TABLE "process_steps" ADD COLUMN "vsm_state" "vsm_state" DEFAULT 'current' NOT NULL`
      );
      await db.execute(
        sql`ALTER TABLE "process_steps" ADD COLUMN "source_step_id" uuid`
      );
      await db.execute(
        sql`ALTER TABLE "process_steps" ADD COLUMN "justification" text`
      );
    }

    // Migration 0002: linked_initiative_ids
    const initColCheck = await db.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'process_steps' AND column_name = 'linked_initiative_ids'`
    );
    if ((initColCheck as unknown as unknown[]).length === 0) {
      await db.execute(
        sql`ALTER TABLE "process_steps" ADD COLUMN "linked_initiative_ids" jsonb`
      );
    }

    // Migration 0003: vsm_scenarios table + scenario_id column
    const scenarioTableCheck = await db.execute(
      sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'vsm_scenarios'`
    );
    if ((scenarioTableCheck as unknown as unknown[]).length === 0) {
      await db.execute(sql`
        CREATE TABLE "vsm_scenarios" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
          "created_by" uuid,
          "updated_by" uuid,
          "case_id" uuid NOT NULL REFERENCES "cases"("id"),
          "name" text NOT NULL,
          "description" text
        )
      `);
      await db.execute(sql`CREATE INDEX "vsm_scenarios_case_id_idx" ON "vsm_scenarios" USING btree ("case_id")`);
    }

    const scenarioColCheck = await db.execute(
      sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'process_steps' AND column_name = 'scenario_id'`
    );
    if ((scenarioColCheck as unknown as unknown[]).length === 0) {
      await db.execute(sql`ALTER TABLE "process_steps" ADD COLUMN "scenario_id" uuid`);
    }

    // Migration 0004: process_step_initiatives join table
    const psiTableCheck = await db.execute(
      sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'process_step_initiatives'`
    );
    if ((psiTableCheck as unknown as unknown[]).length === 0) {
      await db.execute(sql`
        CREATE TABLE "process_step_initiatives" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "process_step_id" uuid NOT NULL REFERENCES "process_steps"("id") ON DELETE CASCADE,
          "initiative_id" uuid NOT NULL REFERENCES "initiatives"("id") ON DELETE CASCADE,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
      await db.execute(sql`CREATE INDEX "psi_step_id_idx" ON "process_step_initiatives" USING btree ("process_step_id")`);
      await db.execute(sql`CREATE INDEX "psi_initiative_id_idx" ON "process_step_initiatives" USING btree ("initiative_id")`);
    }

    // Backfill: sync linkedInitiativeIds → process_step_initiatives
    const stepsWithLinks = await db.execute(
      sql`SELECT id, linked_initiative_ids FROM process_steps WHERE linked_initiative_ids IS NOT NULL AND linked_initiative_ids != '[]'::jsonb AND linked_initiative_ids != 'null'::jsonb`
    );
    let backfilled = 0;
    for (const row of stepsWithLinks as unknown as { id: string; linked_initiative_ids: string[] }[]) {
      const ids = row.linked_initiative_ids;
      if (!Array.isArray(ids)) continue;
      for (const initId of ids) {
        // Check if already exists to be idempotent
        const existing = await db.execute(
          sql`SELECT 1 FROM process_step_initiatives WHERE process_step_id = ${row.id} AND initiative_id = ${initId} LIMIT 1`
        );
        if ((existing as unknown as unknown[]).length === 0) {
          await db.execute(
            sql`INSERT INTO process_step_initiatives (id, process_step_id, initiative_id) VALUES (gen_random_uuid(), ${row.id}, ${initId})`
          );
          backfilled++;
        }
      }
    }

    // Fix: ensure CASCADE on initiative_id FK (may be missing if table was created before fix)
    try {
      await db.execute(sql`
        ALTER TABLE "process_step_initiatives"
        DROP CONSTRAINT IF EXISTS "process_step_initiatives_initiative_id_initiatives_id_fk"
      `);
      await db.execute(sql`
        ALTER TABLE "process_step_initiatives"
        ADD CONSTRAINT "process_step_initiatives_initiative_id_initiatives_id_fk"
        FOREIGN KEY ("initiative_id") REFERENCES "initiatives"("id") ON DELETE CASCADE
      `);
    } catch {
      // Constraint may already be correct
    }

    return NextResponse.json({ status: "ok", message: "All migrations applied", backfilled });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 },
    );
  }
}
