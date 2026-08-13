import type { Dictionary } from './da'

/**
 * English is a first-class equivalent, not a fallback. Typed as `Dictionary`, so
 * a missing or misspelled key fails `tsc`.
 *
 * Note what is *not* translated: enum values stored in the database stay Danish
 * as canonical keys and are translated at render time by `lib/i18n/enums.ts`.
 */
export const en: Dictionary = {
  app: {
    name: 'Kompas',
    tagline: 'AI Product Ops for the product team',
  },

  nav: {
    overblik: 'Overview',
    agenter: 'Agents',
    sagsspejl: 'Case Mirror',
    faerdigheder: 'Skills',
    evalueringer: 'Evaluations',
    indsigter: 'Insights',
    revisionsspor: 'Audit log',
    haandbog: 'Playbook',
    collapse: 'Collapse sidebar',
    expand: 'Expand sidebar',
    primary: 'Primary navigation',
  },

  banner: {
    text: 'Demo environment · All data is synthetic. Never paste real citizen data.',
    dismiss: 'Dismiss',
  },

  theme: {
    label: 'Colour theme',
    light: 'Light',
    dark: 'Dark',
    system: 'Match system',
  },

  locale: {
    label: 'Language',
    da: 'Danish',
    en: 'English',
  },

  common: {
    loading: 'Loading …',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    none: 'None',
    of: 'of',
    show: 'Show',
    hide: 'Hide',
    details: 'Details',
    back: 'Back',
    retry: 'Try again',
    sourceTextDanish: 'Source text (Danish)',
    yes: 'Yes',
    no: 'No',
  },

  units: {
    ms: 'ms',
    tokens: 'tokens',
    tokensIn: 'Tokens in',
    tokensOut: 'Tokens out',
    cost: 'Cost',
    latency: 'Latency',
    model: 'Model',
    promptVersion: 'Prompt version',
    agent: 'Agent',
    created: 'Created',
    status: 'Status',
  },

  status: {
    ok: 'Completed',
    error: 'Error',
    blocked: 'Blocked',
  },

  verdict: {
    label: 'Human verdict',
    pending: 'Pending',
    accepted: 'Accepted',
    edited: 'Edited',
    rejected: 'Rejected',
  },

  audit: {
    title: 'Audit log',
    subtitle:
      'Every single model call — model, prompt version, cost, latency and the human verdict.',
    empty: 'No runs to show yet. Run an agent and it will appear here.',
    emptyAction: 'Go to Agents',
    inputHash: 'Input hash',
    inputText: 'Input',
    outputText: 'Output',
    errorMessage: 'Error message',
    humanNote: 'Note',
    verdictAt: 'Reviewed',
    rowCount: (n: number) => (n === 1 ? '1 run' : `${n} runs`),
  },

  overblik: {
    title: 'Overview',
    subtitle: "Where the team's AI work stands right now.",
    runs7d: 'Runs (7 days)',
    spendMonth: 'Spend this month',
    acceptanceRate: 'Acceptance rate',
    blockedCpr: 'Blocked CPR attempts',
    recentRuns: 'Recent runs',
    noVerdictsYet: 'Nothing reviewed yet',
    blockedHint: 'Submissions stopped by the CPR detector before they reached the model.',
  },

  modules: {
    agenter: {
      title: 'Agents',
      subtitle:
        'Run an agent on realistic input and get a structured result you can accept, edit or reject.',
      empty: 'There are no agents in the registry yet.',
    },
    sagsspejl: {
      title: 'Case Mirror',
      subtitle:
        'Check a case note against VUM 2.0, ICS and clinical documentation practice — form and completeness, not the social-work judgement.',
      empty: 'Paste a synthetic note to get started.',
    },
    faerdigheder: {
      title: 'Skills',
      subtitle: "The registry of the team's reusable AI skills, and the tool for writing new ones.",
      empty: 'There are no skills in the registry yet.',
    },
    evalueringer: {
      title: 'Evaluations',
      subtitle:
        'Measured quality per prompt version. Deterministic checks first, then a judge model across five dimensions.',
      empty: 'No eval runs yet. Run npm run eval to create the first one.',
    },
    indsigter: {
      title: 'Insights',
      subtitle: 'Patterns in feedback, quality, cost and latency over time.',
      empty: 'No data to plot yet. The charts fill in once there are runs.',
    },
    haandbog: {
      title: 'Playbook',
      subtitle: 'How we use Kompas — and what it must not be used for.',
      empty: 'That chapter does not exist.',
    },
  },

  db: {
    notConfiguredTitle: 'The database is not configured',
    notConfiguredBody:
      'DATABASE_URL is missing. Copy .env.example to .env.local, paste a Neon connection string, then run npm run db:push.',
    unreachableTitle: 'Could not reach the database',
    unreachableBody:
      'The connection to Neon failed. Check DATABASE_URL and that the database is awake.',
  },

  design: {
    title: 'Design system',
    subtitle: "Every component in both themes. This page is the project's own visual regression test.",
    colours: 'Colours',
    typography: 'Typography',
    buttons: 'Buttons',
    badges: 'Badges',
    tables: 'Tables',
    states: 'States',
    semanticRule:
      'Colour carries meaning only. Petrol = interactive. Green = passed. Amber = needs review. Red = failed or blocked. Blue = informational. Colour never stands alone — there is always an icon or a text label beside it.',
  },

  agent: {
    inputTitle: 'Enquiry',
    inputPlaceholder: 'Paste an enquiry from a municipality …',
    inputHint: 'Synthetic text only. CPR numbers are blocked before the text leaves the browser.',
    resultTitle: 'Result',
    resultEmpty: 'Run the agent to see a proposal here.',
    run: 'Run agent',
    running: 'Running …',
    stop: 'Stop',
    useSample: 'Insert example',
    clear: 'Clear',
    charCount: (n: number, max: number) => `${n} / ${max} characters`,
    versionLabel: 'Prompt version',
    versionNotes: 'What changed in this version',

    proposalNotice:
      'This is a proposal, not a decision. Nothing happens on its own — you accept, edit or reject it.',
    accept: 'Accept',
    edit: 'Edit',
    reject: 'Reject',
    verdictSaved: 'Verdict saved',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Why did you reject the proposal?',
    addAsEvalCase: 'Add as eval case',
    submitVerdict: 'Save verdict',
    evalCaseCreated: 'Eval case created',
    evalCaseCommitHint:
      'The case is in the database and appears immediately. Copy the line below into evals/<agent>/cases.jsonl and commit it — that file is the source for npm run eval and for CI.',

    fields: {
      resumé: 'Summary',
      produkt: 'Product',
      tema: 'Theme',
      alvorlighed: 'Severity',
      begrundelse_alvorlighed: 'Justification for severity',
      fagligt_domæne: 'Professional domain',
      påvirkede_brugere: 'Users affected',
      foreslået_user_story: 'Proposed user story',
      som: 'As',
      ønsker_jeg: 'I want',
      så_jeg: 'so that I',
      åbne_spørgsmål: 'Open questions',
      citat: 'Quote from the enquiry',
    },
  },

  sagsspejl: {
    scopeNotice:
      'Case Mirror assesses the form and completeness of the documentation — not the social-work judgement. The professional decision is always the caseworker’s.',
    consentLabel:
      'I confirm that this text is synthetic and contains no personally identifiable information.',
    noteTitle: 'Case note',
    notePlaceholder: 'Paste a synthetic case note …',
    analyse: 'Analyse note',
    analysing: 'Analysing …',
    pickSeed: 'Choose an example note',
    tabFindings: 'Findings',
    tabRewrite: 'Suggested rewrite',
    overall: 'Overall assessment',
    method: 'Method',
    findings: 'Findings',
    noFindings: 'No findings. The note meets the requirements for form and completeness.',
    missingFields: 'Missing fields',
    strengths: 'Strengths',
    justification: 'Justification',
    suggestion: 'Suggestion',
    quote: 'Extract',
    jumpToQuote: 'Show in the note',
    quoteNotFound: 'This extract does not appear verbatim in the note',
    rewriteApplied: (n: number) => (n === 1 ? '1 suggestion applied' : `${n} suggestions applied`),
    rewriteUnmatched: (n: number) =>
      n === 1
        ? '1 suggestion could not be applied, because the extract does not appear verbatim in the note.'
        : `${n} suggestions could not be applied, because the extracts do not appear verbatim in the note.`,
    rewriteHint: 'Nothing is applied automatically. Copy whatever you want to use.',
    copyRewrite: 'Copy rewrite',
    removed: 'Removed',
    added: 'Added',
    footerRun: 'View this run in the audit log',
    blockedCount: 'Blocked submissions',
  },

  evals: {
    suite: 'Suite',
    passRate: 'Pass rate',
    meanScore: 'Mean score',
    lastRun: 'Last run',
    cost: 'Cost',
    trend: 'Trend',
    caseId: 'Case',
    result: 'Result',
    passed: 'Passed',
    failed: 'Failed',
    unstable: 'Unstable',
    unstableExplained:
      'The judge gave different scores across the three passes. An unstable case means an ambiguous rubric — that is a finding, not noise.',
    calibration: 'Calibration',
    calibrationExplained:
      'Calibration cases carry a deliberately bad output. If the judge scores them well, the judge is broken and the whole run is untrustworthy.',
    judgeUntrustworthy: 'The judge failed calibration',
    deterministic: 'Deterministic checks',
    failedChecks: 'Failed checks',
    judgeRationale: 'Judge rationales',
    judgePass: (n: number) => `Pass ${n}`,
    spreadLabel: 'Spread',
    input: 'Input',
    output: 'Output',
    rubricNotes: 'Rubric notes',
    latency: 'Latency',
    version: 'Version',
    model: 'Model',
    compare: 'Compare versions',
    compareTitle: 'Comparison',
    versionA: 'Version A',
    versionB: 'Version B',
    improved: 'Improved',
    worsened: 'Regressed',
    unchanged: 'Unchanged',
    delta: 'Change',
    noComparison:
      'There are no runs for both versions yet. Run npm run eval with each version first.',
    scoreOf: (score: number) => `${score.toFixed(1)} / 5`,
    caseCount: (n: number) => (n === 1 ? '1 case' : `${n} cases`),
    runSuiteHint: 'Run npm run eval to create a run.',
    passRule: 'Passing requires: all deterministic checks + mean score ≥ 4.0 + safety ≥ 4.',
    safetyVeto: 'Safety is a veto, not an average.',
  },

  errors: {
    rate_limit: 'Could not reach the Gemini API (429 – too many calls). Try again in 30 seconds.',
    timeout: 'The model did not answer within 60 seconds. Try again, or shorten the text.',
    auth: 'The API key is missing or was rejected. Check GOOGLE_GENERATIVE_AI_API_KEY.',
    server: 'The Gemini API returned a server error. This is temporary — try again.',
    schema:
      'The model’s answer did not match the schema. The run is logged as failed and nothing was stored as a valid result.',
    cpr_blocked:
      'The text contains something that looks like a CPR number. Submission was stopped and the text was not sent to the model.',
    too_long: 'The text is too long. The maximum is 8,000 characters.',
    consent_required:
      'You must confirm that the text is synthetic before it can be analysed. The confirmation applies to this session only.',
    no_database:
      'The database is not configured. Every model call must be logged, so the run cannot start without it.',
    unknown_agent: 'That agent does not exist.',
    unknown_version: 'That prompt version does not exist.',
    bad_request: 'The request could not be read.',
    unknown: 'An unexpected error occurred. The run has been logged.',
  },

  error: {
    generic: 'Something failed while loading this page.',
    notFound: 'Page not found',
    notFoundBody: 'That address leads nowhere. Use the menu on the left.',
  },
}
