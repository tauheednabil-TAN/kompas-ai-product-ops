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
