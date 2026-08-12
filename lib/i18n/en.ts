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

  error: {
    generic: 'Something failed while loading this page.',
    notFound: 'Page not found',
    notFoundBody: 'That address leads nowhere. Use the menu on the left.',
  },
}
