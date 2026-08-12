import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const runStatus = pgEnum('run_status', ['ok', 'error', 'blocked'])
export const humanVerdict = pgEnum('human_verdict', ['pending', 'accepted', 'edited', 'rejected'])
export const caseSource = pgEnum('case_source', ['curated', 'from_rejection', 'calibration'])
export const skillStatus = pgEnum('skill_status', ['draft', 'published'])

/* -------------------------------------------------------------------------- */
/* agent_runs — constraint C4. Written on every model call, without exception. */
/* -------------------------------------------------------------------------- */

export const agentRuns = pgTable(
  'agent_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentSlug: text('agent_slug').notNull(),
    promptVersion: text('prompt_version').notNull(),
    modelId: text('model_id').notNull(),

    inputText: text('input_text').notNull(),
    /** SHA-256 of the input. Lets us group repeat runs without storing it twice. */
    inputHash: text('input_hash').notNull(),
    outputJson: jsonb('output_json'),
    outputText: text('output_text'),

    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    costDkk: doublePrecision('cost_dkk').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),

    status: runStatus('status').notNull().default('ok'),
    errorMessage: text('error_message'),

    humanVerdict: humanVerdict('human_verdict').notNull().default('pending'),
    humanNote: text('human_note'),
    editedOutput: jsonb('edited_output'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    verdictAt: timestamp('verdict_at', { withTimezone: true }),
  },
  (t) => [
    index('agent_runs_created_idx').on(t.createdAt),
    index('agent_runs_agent_idx').on(t.agentSlug),
    index('agent_runs_hash_idx').on(t.inputHash),
  ],
)

/* -------------------------------------------------------------------------- */
/* Evals                                                                      */
/* -------------------------------------------------------------------------- */

export const evalSuites = pgTable('eval_suites', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentSlug: text('agent_slug').notNull(),
  /** Stable slug used in URLs, e.g. "feedback-triage". */
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const evalCases = pgTable(
  'eval_cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    suiteId: uuid('suite_id')
      .notNull()
      .references(() => evalSuites.id, { onDelete: 'cascade' }),
    /** Human-facing id from the JSONL file, e.g. "ft-014". */
    externalId: text('external_id').notNull(),
    inputText: text('input_text').notNull(),

    /** Exact field matches the output must satisfy. */
    expectedJson: jsonb('expected_json'),
    mustInclude: text('must_include').array().notNull().default([]),
    mustNotInclude: text('must_not_include').array().notNull().default([]),

    /** Shown to the judge. Must describe observable properties, not preferences. */
    rubricNotes: text('rubric_notes').notNull().default(''),
    source: caseSource('source').notNull().default('curated'),

    /**
     * Calibration cases carry a deliberately bad output. If the judge scores one
     * of these >= 3.5 the judge itself is broken and the whole run is untrusted.
     */
    calibrationOutput: jsonb('calibration_output'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('eval_cases_suite_idx').on(t.suiteId)],
)

export const evalRuns = pgTable(
  'eval_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    suiteId: uuid('suite_id')
      .notNull()
      .references(() => evalSuites.id, { onDelete: 'cascade' }),
    promptVersion: text('prompt_version').notNull(),
    modelId: text('model_id').notNull(),
    /** Which locale the agent was asked to answer in for this run. */
    locale: text('locale').notNull().default('da'),

    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),

    passCount: integer('pass_count').notNull().default(0),
    failCount: integer('fail_count').notNull().default(0),
    meanScore: real('mean_score').notNull().default(0),

    totalCostDkk: doublePrecision('total_cost_dkk').notNull().default(0),
    p50LatencyMs: integer('p50_latency_ms').notNull().default(0),
    p95LatencyMs: integer('p95_latency_ms').notNull().default(0),

    /**
     * False when a calibration case scored too well. The whole run's numbers are
     * then reported as untrustworthy rather than quietly used.
     */
    judgeTrustworthy: boolean('judge_trustworthy').notNull().default(true),
    judgeTrustNote: text('judge_trust_note'),
  },
  (t) => [index('eval_runs_suite_idx').on(t.suiteId), index('eval_runs_started_idx').on(t.startedAt)],
)

export const evalResults = pgTable(
  'eval_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    evalRunId: uuid('eval_run_id')
      .notNull()
      .references(() => evalRuns.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => evalCases.id, { onDelete: 'cascade' }),

    outputJson: jsonb('output_json'),

    /** Layer 1. Any failure fails the case regardless of judge score. */
    deterministicPass: boolean('deterministic_pass').notNull().default(false),
    failedChecks: text('failed_checks').array().notNull().default([]),

    /** { korrekthed, fuldstaendighed, sprogkvalitet, format, sikkerhed } — medians. */
    scoresJson: jsonb('scores_json'),
    /** Max spread across the three judge passes, per dimension. */
    spreadJson: jsonb('spread_json'),
    /** True when any dimension's spread > 1 — an ambiguous rubric, which is a finding. */
    unstable: boolean('unstable').notNull().default(false),

    meanScore: real('mean_score').notNull().default(0),
    passed: boolean('passed').notNull().default(false),
    /** All three rationales, so a reviewer can see the judge disagree with itself. */
    judgeRationale: jsonb('judge_rationale'),

    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    costDkk: doublePrecision('cost_dkk').notNull().default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
  },
  (t) => [index('eval_results_run_idx').on(t.evalRunId), index('eval_results_case_idx').on(t.caseId)],
)

/* -------------------------------------------------------------------------- */
/* Skills                                                                     */
/* -------------------------------------------------------------------------- */

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  frontmatterYaml: text('frontmatter_yaml').notNull(),
  bodyMd: text('body_md').notNull(),
  status: skillStatus('status').notNull().default('draft'),
  githubPrUrl: text('github_pr_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/* -------------------------------------------------------------------------- */
/* Seed domain data — synthetic, Danish, never machine-translated (Layer 3).  */
/* -------------------------------------------------------------------------- */

export const feedbackItems = pgTable('feedback_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: text('external_id').notNull().unique(),
  kommune: text('kommune').notNull(),
  product: text('product').notNull(),
  channel: text('channel').notNull(),
  rawText: text('raw_text').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
})

/* -------------------------------------------------------------------------- */
/* Blocked submissions — the CPR guard's own audit trail.                     */
/*                                                                            */
/* Deliberately stores NO text: the whole point is that nothing which tripped  */
/* the detector is persisted. Only that it happened, and where.                */
/* -------------------------------------------------------------------------- */

export const blockedSubmissions = pgTable('blocked_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  surface: text('surface').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type AgentRun = typeof agentRuns.$inferSelect
export type NewAgentRun = typeof agentRuns.$inferInsert
export type EvalSuite = typeof evalSuites.$inferSelect
export type EvalCase = typeof evalCases.$inferSelect
export type EvalRun = typeof evalRuns.$inferSelect
export type EvalResult = typeof evalResults.$inferSelect
export type Skill = typeof skills.$inferSelect
export type FeedbackItem = typeof feedbackItems.$inferSelect
