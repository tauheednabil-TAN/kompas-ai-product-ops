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

---

## 2026-08-13 — Phase 1: Shell, design system, i18n, DB, audit log

### Shipped

- **i18n from the first commit.** `lib/i18n/{da,en}.ts`. Danish is the source
  dictionary; English is typed as `Dictionary`, so a missing key is a **compile**
  error rather than a silent fallback. Both dictionaries ship to the client, which
  is what makes the DA|EN toggle instant with no reload.
- **Full Drizzle schema** for all eight tables in §6, plus `blocked_submissions`
  for the CPR guard's own trail.
- **`/revisionsspor`** reading real rows, with a drill-down sheet.
- **`/haandbog/design`** — every component in both themes; the project's own
  visual regression check.
- Sidebar with collapse, DA|EN segmented control, three-way theme toggle,
  synthetic-data banner, all eight routes.
- `docs/design.md` documenting the system as built and both deviations from §4.

### Decisions made and why

| Decision | Reasoning |
| --- | --- |
| Radix primitives directly, **not** the shadcn CLI | `shadcn init` rewrites `globals.css` with its own competing token system, and every component would still need stripping of shadows/weights that violate §4. Radix gives the hard part (a11y, focus, keyboard); the styling is less work to write than to correct. |
| Both dictionaries on the client | A cookie + `router.refresh()` would flash and round-trip. A few kB buys a genuinely instant toggle, which §4.5 asks for by name. |
| Sidebar/banner state in **cookies**, not `localStorage` | A client-only read paints the wrong layout and then snaps. The server reads the cookie and gets it right on first paint. The banner uses a *session* cookie (no max-age) so C2's "per session, never per user" is enforced by the browser, not by us. |
| DB queries return a tagged result, never throw | "Not configured", "unreachable" and "fine but empty" are three different problems with three different fixes. An error boundary flattens them into one useless screen. |
| `design-scout` not run | §4 is marked authoritative and already prescribes layout, hierarchy, interaction and motion in detail. Little left to decide, real risk of drifting from a spec that wins on conflict. Time went to Phase 4 instead. Reasoning in `docs/design.md` §3. |
| Danish dictionary is **not** `as const` | With const assertions every value becomes its own literal type, so `Dictionary` would demand the English text be character-identical to the Danish. Caught by `tsc` in ~50 errors; the fix is one line and a comment. |

### Bugs found by loading the page that the build did not catch

Worth recording, because it is the whole argument for step 4 of the loop:

1. **`isLocale()` called from a Server Component.** It lived in a `'use client'`
   module, so every export became a client reference. `npm run verify` was fully
   green — typecheck, lint, tests and production build all passed — and every
   route 500'd on load. Fixed by splitting server/client-shared primitives into
   `lib/i18n/config.ts`, `lib/theme/config.ts` and `lib/ui-cookies.ts`.
2. **Dynamic Tailwind classes.** The design gallery built swatch classes as
   `` bg-${name} ``. Tailwind scans for literal strings, so it emitted no CSS at
   all — a page whose entire job is to prove the tokens work would have been
   lying. Now written out in full.
3. **`tailwindcss-animate` utilities used without the plugin.** The sheet's
   enter/exit classes were inert. Replaced with real keyframes in `globals.css`.

### Cut / deferred

- The five module routes (`/agenter`, `/sagsspejl`, `/faerdigheder`,
  `/evalueringer`, `/indsigter`) currently render their real page header and a
  real empty state. They are filled in by their own phases. The empty states are
  not placeholders — they survive into the shipped build as the genuine
  no-data-yet state for each module.

### Verification

- `npm run verify` green: typecheck → lint → **13 tests** → build, 9 routes.
- All 8 routes return 200 with the correct Danish `<h1>`; an unknown path 404s.
- Locale toggle: `lang` flips to `en`, `hyphens` to `manual`, cookie persists,
  every nav item and the banner translate, **zero** Danish characters left
  anywhere in the chrome (asserted in the browser and in a test).
- Contrast measured in the running app, not calculated on paper:
  - Light, vs page background: ink 17.3, muted 5.96, faint 4.57, accent 8.67,
    ok 6.19, warn 5.66, danger 7.20, info 8.29.
  - Dark, vs surface: ink 14.9, muted 6.62, faint 5.01, accent 6.20, and every
    coloured chip on its own soft fill ≥ 5.13.
  - All ≥ 4.5:1.
- At 375px: sidebar forced to the 60px rail, nav labels hidden, page body does
  **not** scroll horizontally, wide tables scroll inside their own container.
- A11y spot-check: one `<nav>` and one `<main>` landmark, zero buttons without an
  accessible name, zero decorative SVGs exposed to assistive tech.

### Known issues

- Still no `GOOGLE_GENERATIVE_AI_API_KEY` and no `DATABASE_URL`. Every page that
  reads the database currently renders the "not configured" notice — which is the
  correct behaviour, and is itself verified, but it means the audit log has never
  been seen with real rows.
- Lighthouse has not been run; the environment cannot display the browser pane, so
  screenshots and Lighthouse are both unavailable. Verification is being done
  through the accessibility tree, computed styles and measured contrast instead.
  Lighthouse must be run before the Definition of Done can be signed off.

### Next

Phase 2 — agent runtime, prompt versioning, streaming, telemetry writes, and the
Feedback-triage agent.

---

## 2026-08-13 — Phase 2: Agent runtime + Feedback-triage

> **This phase is code-complete but NOT accepted.** Its acceptance criteria
> require running all 30 seed items against a live model, and there is no API key
> and no database on this machine. Everything verifiable without credentials is
> verified and green; everything that needs them is listed under *Blocked* below.
> Nothing has been marked done that has not actually been done.

### Shipped

- **Prompt versioning as files.** `lib/agents/feedback-triage/prompt.v1.ts` and
  `prompt.v2.ts`, each a value carrying its own tier, temperature, system prompt
  and builder. v2 is not a tweak of v1 — it adds an explicit severity rubric, a
  rule for reading through emotional tone, and a worked Danish example. The two
  will produce genuinely different output, which is what makes Phase 4's
  comparison view worth building.
- **Streaming route** (`app/api/agents/[slug]/run/route.ts`) emitting NDJSON
  frames, so one stream carries partial objects, the run id, real cost/latency,
  and a typed error code.
- **Telemetry write is not optional.** A failed run is written to `agent_runs`
  with `status = 'error'` too — the difference between an audit log and a
  success log.
- **CPR guard** with the modulo-11 check, plus an output-side scan.
- **Verdict bar** (Accept / Edit / Reject) writing through a Server Action.
- **30 seed feedback items**, hand-written Danish, 40–330 words, real
  municipalities, mixed registers, including the four deliberately hard cases the
  brief asks for.
- 47 tests.

### Decisions made and why

| Decision | Reasoning |
| --- | --- |
| `AgentDefinition` is **not generic** over its input type | Making it generic forced `any` into the registry: `build` takes its input, which is contravariant, so `PromptVersion<string>` is not a `PromptVersion<unknown>`. `any` violates C5. Every agent here takes free text, so the generic bought nothing and cost a constraint violation. |
| NDJSON frames rather than `toTextStreamResponse()` | The client needs the run id (to attach a verdict), the measured cost and a typed error code — not just the object. One framed stream carries all of it in order. |
| The **CPR check runs before the database check** | Found by testing the API directly: pasting a CPR returned "database not configured". "What happens if I paste a CPR number?" must always answer "it was blocked". Recording the blocked attempt is now best-effort so losing the counter cannot change the answer. |
| Retries delegated to the AI SDK (`maxRetries: 2`) | It already retries only on retryable statuses and honours `retry-after`. Hand-rolling it would be worse code and worse behaviour. |
| Errors are **codes**, never messages | An error message is interface chrome and must obey C1. A Danish string thrown from a server module could never be shown in English. |
| Agent refuses to run when the DB is unreachable | C4 says the telemetry write is not optional. A run that cannot be logged is a run that must not start — so it fails *before* spending an API call, not after. |
| Quote grounding shown in the UI, not just in evals | The `citat` field must be a literal substring of the input. Surfacing that check next to the quote makes the grounding claim inspectable by the person actually using the tool, not only by whoever reads the eval report. |

### Verified

- `npm run verify` green: typecheck → lint → **47 tests** → build, 11 routes.
- **CPR detector**: all five required variants blocked (hyphenated, un-hyphenated,
  mid-sentence, at start of string, inside a multi-line note), plus regex
  `lastIndex` statefulness and non-CPR 10-digit strings covered by tests.
- **In the browser**: typing a CPR number turns the textarea border red, shows the
  specific Danish message, and disables the run button.
- **Against the live API route**: `cpr_blocked` (both hyphen forms) → 400,
  `too_long` → 400, unknown agent → 404, invalid locale → 400, clean input →
  503 `no_database`. Every one is the correct code.
- **Prompt regression test**: asserts the language instruction appears at *both*
  the start and the end of every system prompt, in both locales. This is the
  mitigation §9 prescribes for Danish drifting to English, and without a test it
  could be deleted by accident and nobody would notice until an eval run.

### Blocked — needs `GOOGLE_GENERATIVE_AI_API_KEY` + `DATABASE_URL`

These are the actual Phase 2 acceptance criteria, and none of them can be
attempted yet:

- [ ] Run all 30 seed feedback items; all produce schema-valid output
- [ ] Every run appears in `/revisionsspor` with real cost and latency
- [ ] Accept / Edit / Reject persists
- [ ] Streaming visibly streams

### Known risk not yet testable

The output schema uses Danish field names with non-ASCII characters (`resumé`,
`fagligt_domæne`, `påvirkede_brugere`, `åbne_spørgsmål`). This is faithful to the
domain and to the spec, but structured-output modes can be fussy about non-ASCII
JSON Schema property names. If it turns out to misbehave against the live API, the
fallback is ASCII field names with a display-name map — the enum *values* stay
Danish either way, since those are canonical database keys. Recording it here so
it is a known risk rather than a surprise.

### Next

Phase 3 — Sagsspejl. Guards first, feature second.

---

## 2026-08-13 — Phase 3: Sagsspejl

> Code-complete, guards fully verified, model behaviour unverified. Same
> credentials blocker as Phase 2.

### Shipped

- Schema with the eight finding categories, three severities, and `styrker`
  carrying `.min(1)`.
- `prompt.v1.ts`, in which the scope boundary is stated three times in three
  different ways. The failure that matters here is not a wrong answer — it is
  Sagsspejl being read as a judgement on a citizen's case.
- Two-column UI: the note on the left with each finding's quote marked inline,
  findings on the right grouped by severity, and linking that works in both
  directions.
- **Suggested rewrite tab** with a word-level diff (`lib/diff.ts`), built by
  applying each finding's suggestion to the original note.
- Consent gate, length counter, CPR guard.
- 12 synthetic case notes, every one marked `syntetisk: true`, with the six
  deliberately seeded conditions the brief asks for — including `sn-006` (a
  genuinely good note) and `sn-007`, which is *the same note* differing only in
  that one sentence of professional justification has been removed. That pair is
  the demo.

### Decisions made and why

| Decision | Reasoning |
| --- | --- |
| No separate `/api/sagsspejl/analyse` route | The architecture sketched one, but it would have duplicated the entire streaming, guard and telemetry pipeline. Two pipelines drift, and then what the eval harness measures stops being what users get. Sagsspejl is an agent in the registry with `requiresConsent: true`, enforced by the one shared route. |
| Consent is a **server-side** check | A checkbox is a suggestion. Deleting it from the DOM must change nothing. |
| Quotes that are not literal substrings are **not** fuzzy-matched | A paraphrased quote is itself a finding — the model failed its grounding requirement. Fuzzy matching would paper over exactly the failure the `citat` field exists to expose. The UI says "this extract does not appear verbatim" instead. |
| `syntetisk: true` is a `z.literal`, not a boolean | A seed note not explicitly marked synthetic now fails the build rather than reaching the page. C2 enforced by the type system. |
| The diff does not merge changes across shared whitespace | Tempting, because "x y" then renders as one highlight instead of two. But that space exists on both sides, and absorbing it would make the diff misreport its own input. Exactness beats prettiness in a tool whose job is to be trusted. There is a test naming this trade-off. |

### Verified

- `npm run verify` green: typecheck → lint → **63 tests** → build, 11 routes.
- **Consent gate cannot be bypassed**, tested directly against the route:
  field absent → `consent_required`; `false` → `consent_required`; the *string*
  `"true"` → `bad_request` (it is type-checked, not truthiness-checked);
  `true` → proceeds. A CPR number is still blocked even when consent is given.
- Scope notice renders, analyse button disabled until consent, 12 seed notes
  selectable.
- Diff correctness: reassembling the ops reproduces **both** inputs exactly,
  whitespace included.

### Blocked — needs credentials

- [ ] 12 seed notes all analyse
- [ ] Inline highlight ↔ findings-list linking works on real model output
      (the linking code is exercised, but never yet with findings the model
      actually produced)
- [ ] Diff view readable on real suggestions

### Next

Phase 4 — the eval harness. The module that gets you hired; it gets the most
time and is never cut.

---

## 2026-08-13 — Phase 4: The eval harness ⭐

> The centrepiece. Every piece of logic that can be tested without a model **is**
> tested — 106 tests, of which 44 are new here. The judge itself has never run.

### Shipped

- **Layer 1, deterministic** (`lib/evals/checks.ts`): schema validity,
  must/must-not strings, exact field expectations with dotted paths, verbatim
  quote grounding, output language, CPR in output, latency ceiling. Any failure
  fails the case regardless of the judge.
- **Layer 2, the judge** (`lib/evals/judge.ts`) with all four hardening measures:
  blind grading, rationale declared *before* score in the schema so reasoning
  conditions the number, three passes with median and reported spread, and two
  calibration cases per suite.
- **`lib/evals/compare.ts`** — pure functions, no DB, no model, so the most
  argued-over screen in the app is fully testable.
- Three views: suite cards with a server-rendered sparkline, the case table with
  per-dimension scores and a drill-down sheet showing **all three** judge
  rationales, and the comparison screen with expandable side-by-side regressions.
- **`npm run eval`** CLI, exiting 2 when the judge fails calibration.
- **CI workflow** that runs only on PRs touching agents/evals, posts one comment
  it updates in place, and fails the check.
- **"Tilføj som eval-case"** on a rejected run.
- `docs/evals.md` — full methodology including what the method *cannot* do.

### Decisions made and why

| Decision | Reasoning |
| --- | --- |
| Judge runs **even when deterministic checks failed** | Cheaper to skip, but then a regression report can only say "this failed" and never "this failed *and* quality dropped" — which is the information the comparison view exists to show. |
| Calibration outputs are **schema-valid** | If they were malformed, layer 1 would catch them and they would never reach the judge — which is the thing being calibrated. They have to be plausible *and* bad. |
| The two calibration cases fail in **different ways** | One is confidently inventive (fabricated product, invented user count, a diagnosis, a fake quote); the other is empty and marketing-toned with a paraphrased quote. A judge can be blind to one style and not the other. |
| Score noise floor of **0.2** | The judge's own spread across three passes is frequently that large. Calling anything smaller an improvement would be exactly the vibes-based claim this harness replaces. A pass/fail flip always overrides it. |
| Calibration cases **excluded** from pass rate | They measure the judge, not the prompt. Including them would move the headline number for reasons unrelated to the version being compared. |
| Eval telemetry goes to `eval_results`, **not** `agent_runs` | C4 is satisfied — every call is logged — but hundreds of eval rows would drown the audit log, which exists to answer "what did we do to a real user's input". |
| "Add as eval case" writes to **both** DB and a JSONL line | The row makes it visible immediately; the file is the source for `npm run eval` and CI. A case that only exists in a database is not a regression test, it is a note. |
| `percentile` moved to `lib/evals/stats.ts` | `runner.ts` is `server-only`, which made a pure function untestable. Pure logic belongs in pure modules. |

### Fixed along the way

- **Test suite went from 72s to 566ms.** The vitest environment was `jsdom`,
  costing ~5 minutes of environment setup across the run, and not one test
  touches the DOM. Switched to `node`, with a `server-only` stub aliased in so
  server modules stay testable.
- The expected-value comparison used a `stringify` that left strings unquoted,
  so a failure read `forventet Ét team, fik Ét hold`. Now JSON-quoted, which also
  stops `"5"` and `5` comparing equal.

### Verified

- `npm run verify` green: typecheck → lint → **106 tests** → build, 13 routes.
- Safety veto has its own test: mean above 4.0 with `sikkerhed: 3` must fail.
- Comparison bucketing tested against a hand-built pair of runs, including the
  noise floor, a pass gained, a pass lost, and a zero-cost baseline returning
  `null` rather than `Infinity`.
- Every JSONL case file parses; every calibration output is schema-valid against
  its agent's own schema; duplicate ids and missing calibration outputs throw
  with the offending line number.
- All three eval routes render; a comparison with no version parameters shows the
  correct empty state rather than guessing which two versions to diff.

### Blocked — needs credentials

- [ ] All four suites run end to end
- [ ] The comparison view shows a **real** v1→v2 delta
- [ ] CI posts a comment on a real merged PR
- [ ] Calibration cases behave correctly against the real judge

The last one is the one I most want to see. The calibration outputs are written
to be caught, but whether `gemini-2.5-pro` actually catches them is exactly the
kind of thing that cannot be reasoned about — only measured.

### Next

Phase 5 — Færdigheder. Still the first candidate to cut if time runs short.
