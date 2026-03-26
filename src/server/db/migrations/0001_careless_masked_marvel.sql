CREATE TYPE "public"."vsm_state" AS ENUM('current', 'future');--> statement-breakpoint
ALTER TABLE "process_steps" ADD COLUMN "vsm_state" "vsm_state" DEFAULT 'current' NOT NULL;--> statement-breakpoint
ALTER TABLE "process_steps" ADD COLUMN "source_step_id" uuid;--> statement-breakpoint
ALTER TABLE "process_steps" ADD COLUMN "justification" text;