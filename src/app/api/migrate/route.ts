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

    return NextResponse.json({ status: "ok", message: "All migrations applied" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 },
    );
  }
}
