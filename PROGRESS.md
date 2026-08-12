# PROGRESS

A dated, honest log. What shipped, what was cut and why, what is known-broken.
This file is meant to be readable by the interviewer.

---

## 2026-08-13 — Phase 0: Recon, decisions, setup

### Shipped

- **Model research** (`docs/models.md`). Fetched Google's live model and pricing
  docs plus the AI SDK Google provider docs, then read the actual TypeScript
  definitions in `node_modules` — the only fully reliable source for the API shape.
- **Model registry** (`lib/ai/models.ts`) — three tiers, prices, and per-family
  thinking controls in exactly one file. `lib/ai/cost.ts` converts tokens to DKK.
- **Scaffold** — Next.js 16.3 (App Router, Turbopack), TypeScript strict + three
  extra strictness flags, Tailwind v4, Vitest, Drizzle config, ESLint hardened to
  enforce C5.
- **Design token layer** (`app/globals.css`) — the full §4 palette in light and
  dark, type scale, radii, the single popover shadow, focus ring, tabular numerals,
  `hyphens: auto` for Danish, and `prefers-reduced-motion` handling.
- `CLAUDE.md` extended with all ten constraints so they survive context compaction.
- `.gitignore` verified to ignore `.env.local` **and** to un-ignore `.env.example`
  before the first commit.

### Decisions made and why

| Decision                                          | Reasoning                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Judge = `gemini-2.5-pro`, not `gemini-3.1-pro-preview` | A preview id can be withdrawn. Worse, a judge that changes behaviour mid-project invalidates every historical eval score — which is the whole point of the harness. |
| Workhorse = `gemini-3.6-flash`, not `gemini-2.5-flash` | 5× the input price, but the absolute difference is ~0.02 kr. per run. Not enough money to pay for worse Danish *myndighedssprog*, which is the product. |
| Fixed USD→DKK constant, not a live FX call        | A demo must not depend on an FX API, and a drifting rate makes historical cost rows incomparable.                                                  |
| AI SDK v7 / Next 16, not the v5 / 15 in the prompt | The prompt's own Phase 0.1 says not to trust its assumptions about versions. API shapes were read from `.d.ts` files rather than recalled.        |
| `--ink-faint` darkened from `#8B9098` to `#6E737B` | The specified value measures 3.2:1 on white. The project's own Definition of Done requires ≥4.5:1. The new value measures 4.8:1. Documented deviation. |
| Dark-mode semantic colours derived, not specified  | §4 only gives dark values for background/surface/border/ink/accent. The ok/warn/danger/info dark set was derived and contrast-checked (all ≥7:1). |

### Cut / deferred

Nothing cut yet.

### Known issues

- **No `GOOGLE_GENERATIVE_AI_API_KEY` and no `DATABASE_URL` on this machine.** No
  live Gemini call has been made yet, and the database has never been reachable.
  Everything downstream of Phase 1 (agents, evals, audit log with real numbers)
  needs both. This is the single largest risk to the build — see the README risk
  note. All code is being written so that these are the only two things missing.
- `npm audit` reports 4 moderate advisories, all from `esbuild` reached through
  `drizzle-kit`. Dev-tooling only; nothing in the production bundle. Not patchable
  without downgrading drizzle-kit. Will be listed in the README limitations.
- Browser screenshots are unavailable in this environment unless the preview pane
  is displayed; verification is being done through the accessibility tree and
  computed styles instead, which is stricter anyway.

### Verification

`npm run verify` green: typecheck → lint → 6 tests → production build.
Dev server loads at `http://localhost:3300`; computed styles confirm the tokens are
live (`background: rgb(250,250,248)`, Inter, 14px/26px scale, `lang="da"`,
`hyphens: auto`).

### Next

Phase 1 — shell, i18n from day one, dark mode, synthetic-data banner, Drizzle
schema, `/revisionsspor`, and the `/haandbog/design` component gallery.
