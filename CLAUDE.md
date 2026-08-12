@AGENTS.md

# Kompas

Internal AI Product Ops workbench for the Product Management team at **EG Digital
Welfare** (Danish case management / HSEQ / EdTech software for Danish and
Norwegian municipalities).

**Pitch:** Kompas turns the PM team's repeated AI work into versioned, measurable,
auditable infrastructure — so the team can prove its AI output got *better*, not
just *different*.

This is a portfolio project for a real job interview on **28 August 2026**. Nothing
may be faked, stubbed, mocked or left as TODO in the shipped build. If a feature
cannot be made real, **cut it rather than fake it**.

---

## Non-negotiable constraints

Re-read these at the start of every work session. Violating one is a build failure.

### Product

- **C1 — Full bilingual parity.** Danish default, English first-class. Three layers,
  see below. Never mix interface languages on one screen. Danish must read as
  *myndighedssprog*, not machine translation.
- **C2 — No real personal data, ever.** All seed data synthetic and labelled. A
  persistent banner states this. A CPR detector blocks submission of anything
  matching Danish CPR patterns.
- **C3 — Every AI output is a proposal, never a decision.** Every output surface has
  Accept / Edit / Reject. The word "automatic" never appears next to a
  citizen-affecting outcome.
- **C4 — Every model call is logged**: timestamp, agent, model id, prompt version,
  input hash, output, token counts, cost in DKK, latency ms, human verdict.

### Engineering

- **C5 — TypeScript strict.** No `any`. No `@ts-ignore`. No `eslint-disable` without
  an inline reason comment. Enforced in `eslint.config.mjs`.
- **C6 — All LLM structured output goes through a Zod schema.** Never parse model
  output with regex or `JSON.parse` on raw text.
- **C7 — No secret reaches the client bundle.** All Gemini calls happen server-side
  in Route Handlers or Server Actions.
- **C8 — Only `GOOGLE_GENERATIVE_AI_API_KEY` and `DATABASE_URL` are required.**
  Everything else is optional and degrades gracefully (e.g. a missing
  `GITHUB_TOKEN` hides the PR button rather than showing it broken).
- **C9 — Every phase ends green.** `npm run verify` must pass before moving on.

### Design

- **C10 — Follow the design system in `docs/design.md` exactly.** No gradients, no
  glassmorphism, no purple, no emoji in UI chrome, no drop shadows except the one
  popover shadow token, no animation longer than 200ms, never `font-weight: 700`,
  never more than one accent colour.

---

## The three language layers (C1, in detail)

1. **Interface chrome** — every visible string comes from `lib/i18n/{da,en}.ts`.
   Zero hardcoded UI strings, anywhere, from the first commit.
2. **Model output** — the active locale is passed into every prompt builder as an
   explicit parameter (`build(input, locale)`), never a global, never inferred, and
   rendered as a hard instruction at both the top *and* bottom of the system prompt.
   **Enum values are the exception:** they stay Danish in the database as canonical
   keys and are translated at render time. Never translate a stored enum — it breaks
   eval comparison across locales.
3. **Domain content stays Danish, always** — seed feedback, case notes, PR
   descriptions, eval golden-set inputs, fetched regulation text. Never
   machine-translated. In English mode these regions get a muted
   `Source text (Danish)` chip.

---

## Stack reality (verified 13 Aug 2026, not assumed)

The original build prompt named older versions. What is actually installed:

| Named in prompt   | Actually installed | Consequence                                        |
| ----------------- | ------------------ | -------------------------------------------------- |
| Vercel AI SDK v5  | `ai@7`             | API read from `node_modules/ai/dist/index.d.ts`.    |
| Next.js 15+       | `next@16.3`        | Turbopack default; `params`/`cookies` are async.    |
| `next lint`       | removed in 16      | `npm run lint` runs the ESLint CLI directly.        |
| Zod               | `zod@4`            | —                                                   |

`usage` from the AI SDK is `{ inputTokens?: number, outputTokens?: number }` — both
can be `undefined`. `lib/ai/cost.ts` coerces to 0 rather than throwing, so a missing
count never loses an audit row.

**Read `node_modules/next/dist/docs/` before writing Next-specific code** (see
AGENTS.md). This Next version differs from training data.

## Model registry

`lib/ai/models.ts` is the **only** place a model id or token price may appear.
Rationale and sources: `docs/models.md`.

- `judge` → `gemini-2.5-pro` (GA on purpose — a preview id could be withdrawn and
  would invalidate historical eval scores)
- `workhorse` → `gemini-3.6-flash`
- `classifier` → `gemini-2.5-flash-lite` (used by `DEMO_MODE`)

USD→DKK is a fixed, dated constant (`6.48`, 11 Aug 2026), not a live rate — a demo
must not depend on an FX API, and a drifting rate makes historical cost rows
incomparable.

## Architectural centrepiece

**Prompt versioning.** A prompt is a file: `lib/agents/<agent>/prompt.v1.ts`,
`prompt.v2.ts`, each exporting `{ version, model, temperature, system, build(input, locale) }`.
Every run records which version produced it. The eval comparison view diffs two
versions. Do not compromise this for convenience — it is what makes the
"measurable, not vibes" story real.

## Commands

```bash
npm run verify     # typecheck -> lint -> test -> build. The gate.
npm run dev        # dev server (port 3300 via the parent .claude/launch.json)
npm run test       # vitest
npm run eval       # run eval suites from the CLI
npm run seed       # seed the database
npm run db:push    # push the Drizzle schema to Neon
```

`vitest.config.mts` sets `pool: 'threads'` deliberately — the default `forks` pool
cannot hand off to workers under this OneDrive path.
