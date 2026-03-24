CREATE TYPE "public"."action_item_status" AS ENUM('pending', 'in_progress', 'completed', 'blocked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('draft', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."cohort_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('leader', 'member');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'facilitator', 'participant', 'observer');--> statement-breakpoint
CREATE TABLE "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"initiative_id" uuid,
	"action_description" text NOT NULL,
	"responsible" text,
	"start_date" date,
	"end_date" date,
	"lead_metric" text,
	"baseline_value" numeric,
	"target_value" numeric,
	"contingency" text,
	"status" "action_item_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"module" text NOT NULL,
	"action_type" text NOT NULL,
	"input_context" jsonb,
	"output" jsonb,
	"model_used" text,
	"tokens_used" integer
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"organization_id" uuid,
	"case_id" uuid,
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"template_id" uuid,
	"sector" text,
	"company_name" text,
	"process_focus" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"locale" text DEFAULT 'es-VE' NOT NULL,
	"status" "case_status" DEFAULT 'draft' NOT NULL,
	"metrics" jsonb,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"description" text,
	"settings" jsonb,
	"status" "cohort_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "diagnostic_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"category" text,
	"question_text" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "diagnostic_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"responded_by" uuid
);
--> statement-breakpoint
CREATE TABLE "initiatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"impact_lead_time" numeric,
	"impact_economic" numeric,
	"impact_resilience" numeric,
	"feasibility_30d" numeric,
	"effort" numeric,
	"external_dependency" numeric,
	"total_score" numeric,
	"classification" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"settings" jsonb,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prioritization_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"impact_lead_time" numeric DEFAULT '0.25' NOT NULL,
	"impact_economic" numeric DEFAULT '0.25' NOT NULL,
	"impact_resilience" numeric DEFAULT '0.20' NOT NULL,
	"feasibility_30d" numeric DEFAULT '0.20' NOT NULL,
	"effort" numeric DEFAULT '0.05' NOT NULL,
	"external_dependency" numeric DEFAULT '0.05' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"step_name" text NOT NULL,
	"department" text,
	"process_time_minutes" numeric,
	"wait_time_hours" numeric,
	"rework_percentage" numeric,
	"system_used" text,
	"wip" integer,
	"adds_value" boolean,
	"observations" text
);
--> statement-breakpoint
CREATE TABLE "risk_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"process_step_id" uuid,
	"risk_description" text NOT NULL,
	"risk_type" text,
	"probability" integer NOT NULL,
	"impact" integer NOT NULL,
	"exposure" numeric,
	"early_signals" text,
	"mitigations" text,
	"additional_action" text
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_member_role" DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" text NOT NULL,
	"cohort_id" uuid NOT NULL,
	"case_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"organization_id" uuid,
	"avatar_url" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "waste_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"problem_description" text NOT NULL,
	"frequency_per_week" numeric,
	"minutes_lost_per_event" numeric,
	"hourly_labor_cost" numeric,
	"units_affected" numeric,
	"unit_margin" numeric,
	"labor_cost_monthly" numeric,
	"margin_lost_monthly" numeric,
	"total_cost_monthly" numeric
);
--> statement-breakpoint
CREATE TABLE "weekly_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"case_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"week_start_date" date,
	"lead_time" numeric,
	"otd_otif" numeric,
	"pct_orders_corrected" numeric,
	"pct_orders_rescheduled" numeric,
	"rework_picking" numeric,
	"plan_progress" numeric,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_questions" ADD CONSTRAINT "diagnostic_questions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_question_id_diagnostic_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."diagnostic_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prioritization_weights" ADD CONSTRAINT "prioritization_weights_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_steps" ADD CONSTRAINT "process_steps_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_items" ADD CONSTRAINT "risk_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_items" ADD CONSTRAINT "risk_items_process_step_id_process_steps_id_fk" FOREIGN KEY ("process_step_id") REFERENCES "public"."process_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_items" ADD CONSTRAINT "waste_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_metrics" ADD CONSTRAINT "weekly_metrics_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "action_items_case_id_idx" ON "action_items" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "action_items_initiative_id_idx" ON "action_items" USING btree ("initiative_id");--> statement-breakpoint
CREATE INDEX "action_items_status_idx" ON "action_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_interactions_case_id_idx" ON "ai_interactions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "ai_interactions_module_idx" ON "ai_interactions" USING btree ("module");--> statement-breakpoint
CREATE INDEX "audit_events_organization_id_idx" ON "audit_events" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_events_case_id_idx" ON "audit_events" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "audit_events_user_id_idx" ON "audit_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_events_event_type_idx" ON "audit_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "cases_organization_id_idx" ON "cases" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cases_template_id_idx" ON "cases" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "cases_status_idx" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cohorts_organization_id_idx" ON "cohorts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cohorts_status_idx" ON "cohorts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "diagnostic_questions_case_id_idx" ON "diagnostic_questions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "diagnostic_questions_order_idx" ON "diagnostic_questions" USING btree ("case_id","order_index");--> statement-breakpoint
CREATE INDEX "diagnostic_responses_case_id_idx" ON "diagnostic_responses" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "diagnostic_responses_question_id_idx" ON "diagnostic_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "diagnostic_responses_responded_by_idx" ON "diagnostic_responses" USING btree ("responded_by");--> statement-breakpoint
CREATE INDEX "initiatives_case_id_idx" ON "initiatives" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "initiatives_classification_idx" ON "initiatives" USING btree ("classification");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "prioritization_weights_case_id_idx" ON "prioritization_weights" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "process_steps_case_id_idx" ON "process_steps" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "process_steps_order_idx" ON "process_steps" USING btree ("case_id","order_index");--> statement-breakpoint
CREATE INDEX "risk_items_case_id_idx" ON "risk_items" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "risk_items_process_step_id_idx" ON "risk_items" USING btree ("process_step_id");--> statement-breakpoint
CREATE INDEX "team_members_team_id_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_cohort_id_idx" ON "teams" USING btree ("cohort_id");--> statement-breakpoint
CREATE INDEX "teams_case_id_idx" ON "teams" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "waste_items_case_id_idx" ON "waste_items" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "weekly_metrics_case_id_idx" ON "weekly_metrics" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "weekly_metrics_case_week_idx" ON "weekly_metrics" USING btree ("case_id","week_number");