import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "facilitator",
  "participant",
  "observer",
]);

export const cohortStatusEnum = pgEnum("cohort_status", [
  "draft",
  "active",
  "completed",
  "archived",
]);

export const teamMemberRoleEnum = pgEnum("team_member_role", [
  "leader",
  "member",
]);

export const caseStatusEnum = pgEnum("case_status", [
  "draft",
  "in_progress",
  "completed",
]);

export const vsmStateEnum = pgEnum("vsm_state", ["current", "future"]);

export const actionItemStatusEnum = pgEnum("action_item_status", [
  "pending",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Helper: audit columns present on every table
// ---------------------------------------------------------------------------

const auditColumns = {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
};

// ---------------------------------------------------------------------------
// 1. organizations
// ---------------------------------------------------------------------------

export const organizations = pgTable(
  "organizations",
  {
    ...auditColumns,
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    settings: jsonb("settings"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("organizations_slug_idx").on(t.slug)],
);

// ---------------------------------------------------------------------------
// 2. users
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    ...auditColumns,
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    role: userRoleEnum("role").notNull(),
    organizationId: uuid("organization_id").references(
      () => organizations.id,
    ),
    avatarUrl: text("avatar_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    index("users_organization_id_idx").on(t.organizationId),
    index("users_role_idx").on(t.role),
  ],
);

// ---------------------------------------------------------------------------
// 3. cohorts
// ---------------------------------------------------------------------------

export const cohorts = pgTable(
  "cohorts",
  {
    ...auditColumns,
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    description: text("description"),
    settings: jsonb("settings"),
    status: cohortStatusEnum("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("cohorts_organization_id_idx").on(t.organizationId),
    index("cohorts_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// 4. cases
// ---------------------------------------------------------------------------

export const cases = pgTable(
  "cases",
  {
    ...auditColumns,
    name: text("name").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    isTemplate: boolean("is_template").notNull().default(false),
    templateId: uuid("template_id"),
    sector: text("sector"),
    companyName: text("company_name"),
    processFocus: text("process_focus"),
    currency: text("currency").notNull().default("USD"),
    locale: text("locale").notNull().default("es-VE"),
    status: caseStatusEnum("status").notNull().default("draft"),
    metrics: jsonb("metrics"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("cases_organization_id_idx").on(t.organizationId),
    index("cases_template_id_idx").on(t.templateId),
    index("cases_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// 5. teams
// ---------------------------------------------------------------------------

export const teams = pgTable(
  "teams",
  {
    ...auditColumns,
    name: text("name").notNull(),
    cohortId: uuid("cohort_id")
      .notNull()
      .references(() => cohorts.id),
    caseId: uuid("case_id").references(() => cases.id),
  },
  (t) => [
    index("teams_cohort_id_idx").on(t.cohortId),
    index("teams_case_id_idx").on(t.caseId),
  ],
);

// ---------------------------------------------------------------------------
// 6. team_members
// ---------------------------------------------------------------------------

export const teamMembers = pgTable(
  "team_members",
  {
    ...auditColumns,
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: teamMemberRoleEnum("role").notNull().default("member"),
  },
  (t) => [
    index("team_members_team_id_idx").on(t.teamId),
    index("team_members_user_id_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// 7. diagnostic_questions
// ---------------------------------------------------------------------------

export const diagnosticQuestions = pgTable(
  "diagnostic_questions",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    orderIndex: integer("order_index").notNull(),
    category: text("category"),
    questionText: text("question_text").notNull(),
    description: text("description"),
  },
  (t) => [
    index("diagnostic_questions_case_id_idx").on(t.caseId),
    index("diagnostic_questions_order_idx").on(t.caseId, t.orderIndex),
  ],
);

// ---------------------------------------------------------------------------
// 8. diagnostic_responses
// ---------------------------------------------------------------------------

export const diagnosticResponses = pgTable(
  "diagnostic_responses",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    questionId: uuid("question_id")
      .notNull()
      .references(() => diagnosticQuestions.id),
    score: integer("score").notNull(),
    comment: text("comment"),
    respondedBy: uuid("responded_by").references(() => users.id),
  },
  (t) => [
    index("diagnostic_responses_case_id_idx").on(t.caseId),
    index("diagnostic_responses_question_id_idx").on(t.questionId),
    index("diagnostic_responses_responded_by_idx").on(t.respondedBy),
  ],
);

// ---------------------------------------------------------------------------
// 9. process_steps
// ---------------------------------------------------------------------------

export const processSteps = pgTable(
  "process_steps",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    orderIndex: integer("order_index").notNull(),
    stepName: text("step_name").notNull(),
    department: text("department"),
    processTimeMinutes: numeric("process_time_minutes"),
    waitTimeHours: numeric("wait_time_hours"),
    reworkPercentage: numeric("rework_percentage"),
    systemUsed: text("system_used"),
    wip: integer("wip"),
    addsValue: boolean("adds_value"),
    observations: text("observations"),
    vsmState: vsmStateEnum("vsm_state").notNull().default("current"),
    sourceStepId: uuid("source_step_id"),
    justification: text("justification"),
    linkedInitiativeIds: jsonb("linked_initiative_ids").$type<string[]>(),
  },
  (t) => [
    index("process_steps_case_id_idx").on(t.caseId),
    index("process_steps_order_idx").on(t.caseId, t.orderIndex),
  ],
);

// ---------------------------------------------------------------------------
// 10. risk_items
// ---------------------------------------------------------------------------

export const riskItems = pgTable(
  "risk_items",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    processStepId: uuid("process_step_id").references(() => processSteps.id),
    riskDescription: text("risk_description").notNull(),
    riskType: text("risk_type"),
    probability: integer("probability").notNull(),
    impact: integer("impact").notNull(),
    exposure: numeric("exposure"),
    earlySignals: text("early_signals"),
    mitigations: text("mitigations"),
    additionalAction: text("additional_action"),
  },
  (t) => [
    index("risk_items_case_id_idx").on(t.caseId),
    index("risk_items_process_step_id_idx").on(t.processStepId),
  ],
);

// ---------------------------------------------------------------------------
// 11. waste_items
// ---------------------------------------------------------------------------

export const wasteItems = pgTable(
  "waste_items",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    problemDescription: text("problem_description").notNull(),
    frequencyPerWeek: numeric("frequency_per_week"),
    minutesLostPerEvent: numeric("minutes_lost_per_event"),
    hourlyLaborCost: numeric("hourly_labor_cost"),
    unitsAffected: numeric("units_affected"),
    unitMargin: numeric("unit_margin"),
    laborCostMonthly: numeric("labor_cost_monthly"),
    marginLostMonthly: numeric("margin_lost_monthly"),
    totalCostMonthly: numeric("total_cost_monthly"),
  },
  (t) => [index("waste_items_case_id_idx").on(t.caseId)],
);

// ---------------------------------------------------------------------------
// 12. initiatives
// ---------------------------------------------------------------------------

export const initiatives = pgTable(
  "initiatives",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    name: text("name").notNull(),
    description: text("description"),
    impactLeadTime: numeric("impact_lead_time"),
    impactEconomic: numeric("impact_economic"),
    impactResilience: numeric("impact_resilience"),
    feasibility30d: numeric("feasibility_30d"),
    effort: numeric("effort"),
    externalDependency: numeric("external_dependency"),
    totalScore: numeric("total_score"),
    classification: text("classification"),
  },
  (t) => [
    index("initiatives_case_id_idx").on(t.caseId),
    index("initiatives_classification_idx").on(t.classification),
  ],
);

// ---------------------------------------------------------------------------
// 13. action_items
// ---------------------------------------------------------------------------

export const actionItems = pgTable(
  "action_items",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    initiativeId: uuid("initiative_id").references(() => initiatives.id),
    actionDescription: text("action_description").notNull(),
    responsible: text("responsible"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    leadMetric: text("lead_metric"),
    baselineValue: numeric("baseline_value"),
    targetValue: numeric("target_value"),
    contingency: text("contingency"),
    status: actionItemStatusEnum("status").notNull().default("pending"),
  },
  (t) => [
    index("action_items_case_id_idx").on(t.caseId),
    index("action_items_initiative_id_idx").on(t.initiativeId),
    index("action_items_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// 14. weekly_metrics
// ---------------------------------------------------------------------------

export const weeklyMetrics = pgTable(
  "weekly_metrics",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    weekNumber: integer("week_number").notNull(),
    weekStartDate: date("week_start_date"),
    leadTime: numeric("lead_time"),
    otdOtif: numeric("otd_otif"),
    pctOrdersCorrected: numeric("pct_orders_corrected"),
    pctOrdersRescheduled: numeric("pct_orders_rescheduled"),
    reworkPicking: numeric("rework_picking"),
    planProgress: numeric("plan_progress"),
    notes: text("notes"),
  },
  (t) => [
    index("weekly_metrics_case_id_idx").on(t.caseId),
    index("weekly_metrics_case_week_idx").on(t.caseId, t.weekNumber),
  ],
);

// ---------------------------------------------------------------------------
// 15. ai_interactions
// ---------------------------------------------------------------------------

export const aiInteractions = pgTable(
  "ai_interactions",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    module: text("module").notNull(),
    actionType: text("action_type").notNull(),
    inputContext: jsonb("input_context"),
    output: jsonb("output"),
    modelUsed: text("model_used"),
    tokensUsed: integer("tokens_used"),
  },
  (t) => [
    index("ai_interactions_case_id_idx").on(t.caseId),
    index("ai_interactions_module_idx").on(t.module),
  ],
);

// ---------------------------------------------------------------------------
// 16. audit_events
// ---------------------------------------------------------------------------

export const auditEvents = pgTable(
  "audit_events",
  {
    ...auditColumns,
    organizationId: uuid("organization_id").references(() => organizations.id),
    caseId: uuid("case_id").references(() => cases.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    eventType: text("event_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
    ipAddress: text("ip_address"),
  },
  (t) => [
    index("audit_events_organization_id_idx").on(t.organizationId),
    index("audit_events_case_id_idx").on(t.caseId),
    index("audit_events_user_id_idx").on(t.userId),
    index("audit_events_event_type_idx").on(t.eventType),
    index("audit_events_entity_idx").on(t.entityType, t.entityId),
  ],
);

// ---------------------------------------------------------------------------
// 17. prioritization_weights
// ---------------------------------------------------------------------------

export const prioritizationWeights = pgTable(
  "prioritization_weights",
  {
    ...auditColumns,
    caseId: uuid("case_id")
      .notNull()
      .references(() => cases.id),
    impactLeadTime: numeric("impact_lead_time").notNull().default("0.25"),
    impactEconomic: numeric("impact_economic").notNull().default("0.25"),
    impactResilience: numeric("impact_resilience").notNull().default("0.20"),
    feasibility30d: numeric("feasibility_30d").notNull().default("0.20"),
    effort: numeric("effort").notNull().default("0.05"),
    externalDependency: numeric("external_dependency")
      .notNull()
      .default("0.05"),
  },
  (t) => [index("prioritization_weights_case_id_idx").on(t.caseId)],
);

// ===========================================================================
// Relations
// ===========================================================================

// --- organizations ---

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  cohorts: many(cohorts),
  cases: many(cases),
  auditEvents: many(auditEvents),
}));

// --- users ---

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  teamMembers: many(teamMembers),
  diagnosticResponses: many(diagnosticResponses),
  aiInteractions: many(aiInteractions),
  auditEvents: many(auditEvents),
}));

// --- cohorts ---

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cohorts.organizationId],
    references: [organizations.id],
  }),
  teams: many(teams),
}));

// --- cases ---

export const casesRelations = relations(cases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [cases.organizationId],
    references: [organizations.id],
  }),
  template: one(cases, {
    fields: [cases.templateId],
    references: [cases.id],
  }),
  teams: many(teams),
  diagnosticQuestions: many(diagnosticQuestions),
  diagnosticResponses: many(diagnosticResponses),
  processSteps: many(processSteps),
  riskItems: many(riskItems),
  wasteItems: many(wasteItems),
  initiatives: many(initiatives),
  actionItems: many(actionItems),
  weeklyMetrics: many(weeklyMetrics),
  aiInteractions: many(aiInteractions),
  auditEvents: many(auditEvents),
  prioritizationWeights: many(prioritizationWeights),
}));

// --- teams ---

export const teamsRelations = relations(teams, ({ one, many }) => ({
  cohort: one(cohorts, {
    fields: [teams.cohortId],
    references: [cohorts.id],
  }),
  case: one(cases, {
    fields: [teams.caseId],
    references: [cases.id],
  }),
  members: many(teamMembers),
}));

// --- team_members ---

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

// --- diagnostic_questions ---

export const diagnosticQuestionsRelations = relations(
  diagnosticQuestions,
  ({ one, many }) => ({
    case: one(cases, {
      fields: [diagnosticQuestions.caseId],
      references: [cases.id],
    }),
    responses: many(diagnosticResponses),
  }),
);

// --- diagnostic_responses ---

export const diagnosticResponsesRelations = relations(
  diagnosticResponses,
  ({ one }) => ({
    case: one(cases, {
      fields: [diagnosticResponses.caseId],
      references: [cases.id],
    }),
    question: one(diagnosticQuestions, {
      fields: [diagnosticResponses.questionId],
      references: [diagnosticQuestions.id],
    }),
    respondent: one(users, {
      fields: [diagnosticResponses.respondedBy],
      references: [users.id],
    }),
  }),
);

// --- process_steps ---

export const processStepsRelations = relations(
  processSteps,
  ({ one, many }) => ({
    case: one(cases, {
      fields: [processSteps.caseId],
      references: [cases.id],
    }),
    riskItems: many(riskItems),
  }),
);

// --- risk_items ---

export const riskItemsRelations = relations(riskItems, ({ one }) => ({
  case: one(cases, {
    fields: [riskItems.caseId],
    references: [cases.id],
  }),
  processStep: one(processSteps, {
    fields: [riskItems.processStepId],
    references: [processSteps.id],
  }),
}));

// --- waste_items ---

export const wasteItemsRelations = relations(wasteItems, ({ one }) => ({
  case: one(cases, {
    fields: [wasteItems.caseId],
    references: [cases.id],
  }),
}));

// --- initiatives ---

export const initiativesRelations = relations(
  initiatives,
  ({ one, many }) => ({
    case: one(cases, {
      fields: [initiatives.caseId],
      references: [cases.id],
    }),
    actionItems: many(actionItems),
  }),
);

// --- action_items ---

export const actionItemsRelations = relations(actionItems, ({ one }) => ({
  case: one(cases, {
    fields: [actionItems.caseId],
    references: [cases.id],
  }),
  initiative: one(initiatives, {
    fields: [actionItems.initiativeId],
    references: [initiatives.id],
  }),
}));

// --- weekly_metrics ---

export const weeklyMetricsRelations = relations(weeklyMetrics, ({ one }) => ({
  case: one(cases, {
    fields: [weeklyMetrics.caseId],
    references: [cases.id],
  }),
}));

// --- ai_interactions ---

export const aiInteractionsRelations = relations(
  aiInteractions,
  ({ one }) => ({
    case: one(cases, {
      fields: [aiInteractions.caseId],
      references: [cases.id],
    }),
    creator: one(users, {
      fields: [aiInteractions.createdBy],
      references: [users.id],
    }),
  }),
);

// --- audit_events ---

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditEvents.organizationId],
    references: [organizations.id],
  }),
  case: one(cases, {
    fields: [auditEvents.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [auditEvents.userId],
    references: [users.id],
  }),
}));

// --- prioritization_weights ---

export const prioritizationWeightsRelations = relations(
  prioritizationWeights,
  ({ one }) => ({
    case: one(cases, {
      fields: [prioritizationWeights.caseId],
      references: [cases.id],
    }),
  }),
);
