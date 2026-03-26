CREATE TABLE "process_step_initiatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_step_id" uuid NOT NULL,
	"initiative_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "process_step_initiatives" ADD CONSTRAINT "process_step_initiatives_process_step_id_process_steps_id_fk" FOREIGN KEY ("process_step_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_step_initiatives" ADD CONSTRAINT "process_step_initiatives_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "psi_step_id_idx" ON "process_step_initiatives" USING btree ("process_step_id");--> statement-breakpoint
CREATE INDEX "psi_initiative_id_idx" ON "process_step_initiatives" USING btree ("initiative_id");