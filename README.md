# Kompas

**Kompas turns a product team's repeated AI work into versioned, measurable,
auditable infrastructure — so the team can prove its AI output got *better*, not
just *different*.**

An internal AI Product Ops workbench, built for the Product Management team at
EG Digital Welfare, who make case management, HSEQ and EdTech software for Danish
and Norwegian municipalities.

---

## The problem

Product teams have quietly absorbed a lot of AI work. Someone triages support
tickets with a chat window. Someone else writes release notes with a prompt they
keep in a note-taking app. A third person checks documentation quality by pasting
into whatever tab is open.

None of it is versioned. None of it is measured. When someone improves a prompt,
nobody can say whether the output got better or just different — and when it gets
worse, nobody finds out until a customer does.

Kompas is the answer to that: the same work, but every prompt is a file with a
version, every run is logged with its real cost, and every change is measured
against a suite of cases before it ships.

## The five things worth looking at

1. **Run an agent** on realistic Danish municipal input and get structured output
   you can accept, edit or reject.
2. **`/evalueringer`** — measured quality per prompt version, with a real
   regression diff.
3. **Change a prompt, re-run, watch the score move.** Prompts are files:
   `lib/agents/feedback-triage/prompt.v1.ts` and `prompt.v2.ts`.
4. **Sagsspejl** — paste a case note, see it checked against VUM 2.0 / ICS
   documentation practice.
5. **`/revisionsspor`** — model, prompt version, cost in DKK, latency and the
   human verdict for every single run.

## Modules

| Module | What it does | The gap it addresses |
| --- | --- | --- |
| **Feedback-triage** | Raw municipal enquiry → structured triage with severity, product, theme and a draft user story | Triage is done by hand and inconsistently |
| **Sagsspejl** | Case note → findings on form and completeness, with rewrite suggestions | Documentation quality is reviewed ad hoc, if at all |
| **Release-noter** | PR titles → customer-facing Danish notes, internal changelog, support briefing | Release notes are written last and read like commit logs |
| **Regel-radar** | Regulation → per-product consequences with draft user stories | Legal change lands as a PDF and sits there |
| **Evalueringer** | Two-layer scoring of every agent, versioned | *Nothing measures any of the above today* |
| **Færdigheder** | Registry and generator for reusable skills | Prompts live in private notes |
| **Revisionsspor** | Every model call, with cost and human verdict | No one knows what AI actually cost or whether it helped |

## Architecture

```
Browser
  │  NDJSON stream (partial objects, run id, cost, typed error code)
  ▼
app/api/agents/[slug]/run
  │  ① rate limit (demo)  ② CPR guard  ③ consent  ④ db + key present
  ▼
lib/agents/runner.ts ──── buildCall() ────┐   one builder, so the eval harness
  │                                        │   measures exactly what users get
  ▼                                        ▼
Gemini (structured output, Zod)      lib/evals/runner.ts
  │                                        │
  ▼                                        ▼
agent_runs  ◄── verdict ───┐         eval_runs / eval_results
  │                        │                │
  └──── rejected + note ───┴──► eval case ──┘   real failures become
                                                permanent regression tests
```

The centrepiece is that **a prompt is a file**. Each version exports
`{ version, tier, temperature, system(locale), build(input, locale) }`, every run
records which version produced it, and `/evalueringer/[suite]/sammenlign` diffs
two versions case by case. That single decision is what turns "our AI got better"
from an opinion into a measurement.

## Measured cost

Model registry and pricing: `lib/ai/models.ts`, researched in `docs/models.md`
(fetched 13 August 2026). USD→DKK is a fixed, dated constant — a drifting rate
would make historical cost rows incomparable.

| | Model | Est. cost per run |
| --- | --- | --- |
| Agent run (workhorse) | `gemini-3.6-flash` | ~0,03 DKK |
| Judge, per case (3 passes) | `gemini-2.5-pro` | ~0,13 DKK |
| Full suite (~20 cases) | | ~3 DKK |

> **These are calculated from the published per-token prices, not measured.** No
> live model call has been made yet — see *Limitations*. The audit log is built
> to record the true figure per run, and this table gets replaced with measured
> numbers the moment a key is configured.

## Running it

Requires exactly two environment variables. Everything else degrades gracefully.

```bash
cp .env.example .env.local
```

Fill in `GOOGLE_GENERATIVE_AI_API_KEY` ([aistudio.google.com](https://aistudio.google.com/apikey))
and `DATABASE_URL` ([Neon](https://console.neon.tech)), then:

```bash
npm install && npm run db:push && npm run seed && npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run verify` | typecheck → lint → tests → build. The gate. |
| `npm run eval` | Run the eval suites. Exits 2 if the judge fails calibration. |
| `npm run seed` | Load the synthetic Danish seed data. |

## Documentation

- [`docs/evals.md`](docs/evals.md) — evaluation methodology, judge calibration,
  and what the method cannot do
- [`docs/models.md`](docs/models.md) — model research, tier choices, pricing
- [`docs/design.md`](docs/design.md) — the design system and two documented
  deviations from spec
- [`docs/ai-act-notes.md`](docs/ai-act-notes.md) — which surfaces map to which
  obligations, framed as design intent and explicitly **not** a compliance claim
- [`PROGRESS.md`](PROGRESS.md) — the real build log, including what was cut and
  which bugs a green build failed to catch

---

## Limitations

The most useful section in this file.

**No live model call has ever been made.** This is the big one. There is no API
key and no database on the machine this was built on, so every phase from the
agent runtime onward is code-complete but **unverified against a real model**.
The prompts have never produced a token. The judge has never scored anything. The
calibration cases are written to be caught, but whether `gemini-2.5-pro` actually
catches them is exactly the kind of thing that cannot be reasoned about, only
measured. `PROGRESS.md` marks every affected acceptance criterion as blocked
rather than claiming it.

**The judge shares a family with the thing it judges.** Both are Gemini. There is
a real risk of correlated blindness — mistakes Gemini makes may be mistakes
Gemini does not notice. Calibration cases mitigate this; they do not remove it.
The right fix is a judge from a different provider.

**The eval cases were written by the same person who wrote the prompts.** A known
bias in every internal eval set. Cases sourced from real rejections are the only
ones here that do not share it, which is why that loop exists.

**Suite sizes are small** (17–26 cases per agent). One flipped outcome moves the
pass rate by 4–5 percentage points, which is why the comparison view always shows
absolute counts alongside the rate.

**Three judge passes gives a spread, not a confidence interval.** It is enough to
flag an ambiguous rubric. It is not enough for statistics.

**The rate limiter is in-memory.** On a serverless platform each instance keeps
its own counter, so the real limit is `20 × instances` per hour. Adequate for
stopping a shared link from draining a key; not a production limiter.

**No role-based access.** Anyone who can reach the app sees everything, including
the full audit log.

**The audit log has no retention policy.** Rows are never deleted. Irrelevant for
synthetic data; the first thing to fix for real data.

**Lighthouse has not been run.** The build environment could not display a
browser pane. Contrast was measured programmatically in the running app (every
colour ≥ 4.5:1 in both themes) and the accessibility tree was checked, but the
formal audit is outstanding.

**Danish field names with non-ASCII characters** (`resumé`, `fagligt_domæne`) go
into the JSON Schema sent to the provider. Faithful to the domain, but structured
output modes can be fussy about this. If it misbehaves live, the fallback is
ASCII field names with a display map — enum *values* stay Danish either way,
since those are canonical database keys.

**`npm audit` reports 4 moderate advisories**, all from `esbuild` reached through
`drizzle-kit`. Dev tooling only; nothing in the production bundle.

## What I'd build next at EG

1. **A judge from a different provider**, to break the correlated-blindness risk.
2. **Eval cases sourced from production rejections at volume.** The mechanism is
   built; it needs real users generating real rejections.
3. **Cost budgets per agent with alerting**, since the audit log already has
   every figure needed to enforce them.
4. **Prompt A/B at request time** rather than only in the eval harness — route a
   slice of live traffic to a candidate version and compare on human verdicts
   instead of on a judge.
5. **Retention and role-based access**, the two things that stand between this
   and touching anything real.
