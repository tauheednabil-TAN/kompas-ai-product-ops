import 'dotenv/config'
import { AGENTS, getAgent } from '../lib/agents/registry'
import { persistSuiteRun, runSuite } from '../lib/evals/runner'
import { formatDkk } from '../lib/ai/cost'

/**
 * npm run eval -- [agent-slug] [--version v1] [--no-persist]
 *
 * With no slug, runs every suite.
 */
function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

async function main(): Promise<void> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set. Copy .env.example to .env.local.')
    process.exit(1)
  }

  const persist = !process.argv.includes('--no-persist')
  if (persist && !process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Pass --no-persist to run without storing results.')
    process.exit(1)
  }

  const requested = process.argv[2]?.startsWith('--') ? undefined : process.argv[2]
  const slugs = requested ? [requested] : AGENTS.map((agent) => agent.slug)

  let anyUntrustworthy = false
  let exitCode = 0

  for (const slug of slugs) {
    const agent = getAgent(slug)
    if (!agent) {
      console.error(`Unknown agent: ${slug}`)
      exitCode = 1
      continue
    }

    const version = arg('version') ?? agent.defaultVersion
    console.log(`\n=== ${slug} @ ${version} ===`)

    const outcome = await runSuite({
      agentSlug: slug,
      promptVersion: version,
      onProgress: (done, total, caseId) => {
        process.stdout.write(`  [${String(done).padStart(2)}/${total}] ${caseId}\n`)
      },
    })

    const total = outcome.passCount + outcome.failCount
    const passRate = total === 0 ? 0 : (outcome.passCount / total) * 100

    console.log(`\n  Bestået:      ${outcome.passCount}/${total} (${passRate.toFixed(0)}%)`)
    console.log(`  Middelscore:  ${outcome.meanScore.toFixed(2)} / 5`)
    console.log(`  Omkostning:   ${formatDkk(outcome.totalCostDkk, 'da')}`)
    console.log(`  Svartid:      p50 ${outcome.p50LatencyMs} ms · p95 ${outcome.p95LatencyMs} ms`)

    const unstable = outcome.outcomes.filter((o) => o.judge?.unstable)
    if (unstable.length > 0) {
      console.log(`  Ustabile:     ${unstable.map((o) => o.case.id).join(', ')}`)
      console.log('                (uenig dommer = tvetydig rubrik. Det er et fund, ikke støj.)')
    }

    if (!outcome.judgeTrustworthy) {
      anyUntrustworthy = true
      console.error(`\n  ⚠ ${outcome.judgeTrustNote}`)
    }

    for (const failed of outcome.outcomes.filter((o) => !o.passed && o.case.source !== 'calibration')) {
      console.log(`\n  ✗ ${failed.case.id}`)
      for (const failure of failed.failures) console.log(`      ${failure.check}: ${failure.detail}`)
      if (failed.judge) {
        console.log(`      score: ${failed.judge.meanScore.toFixed(2)} (sikkerhed ${failed.judge.scores.sikkerhed})`)
      }
    }

    if (persist) {
      const runId = await persistSuiteRun(outcome)
      console.log(`\n  Gemt som eval_run ${runId}`)
    }
  }

  // A run whose judge failed calibration must not be reported as a result.
  if (anyUntrustworthy) exitCode = 2

  process.exit(exitCode)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
