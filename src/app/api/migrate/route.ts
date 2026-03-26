import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { sql } from "drizzle-orm";

export async function GET() {
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

    return NextResponse.json({ status: "ok", message: "All migrations applied" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 },
    );
  }
}
