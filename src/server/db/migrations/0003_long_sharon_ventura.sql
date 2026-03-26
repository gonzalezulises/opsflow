CREATE TABLE "vsm_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "process_steps" ADD COLUMN "scenario_id" uuid;--> statement-breakpoint
ALTER TABLE "vsm_scenarios" ADD CONSTRAINT "vsm_scenarios_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vsm_scenarios_case_id_idx" ON "vsm_scenarios" USING btree ("case_id");