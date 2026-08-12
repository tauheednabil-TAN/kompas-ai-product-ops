import { describe, expect, it } from 'vitest'
import { MODELS, USD_TO_DKK, specById, tierFor } from '@/lib/ai/models'
import { computeCost, formatDkk } from '@/lib/ai/cost'

describe('model registry', () => {
  it('defines all three tiers with positive prices', () => {
    for (const spec of Object.values(MODELS)) {
      expect(spec.id.length).toBeGreaterThan(0)
      expect(spec.inputPerM).toBeGreaterThan(0)
      expect(spec.outputPerM).toBeGreaterThan(0)
    }
  })

  it('resolves a spec back from a stored model id', () => {
    expect(specById(MODELS.judge.id)?.id).toBe('gemini-2.5-pro')
    expect(specById('nonexistent-model')).toBeUndefined()
  })

  it('collapses public tiers to the cheap model in demo mode', () => {
    expect(tierFor('workhorse', false)).toBe('workhorse')
    expect(tierFor('workhorse', true)).toBe('classifier')
    expect(tierFor('judge', true)).toBe('judge')
  })
})

describe('cost', () => {
  it('converts tokens to DKK using the documented rate', () => {
    const cost = computeCost(MODELS.workhorse, { inputTokens: 1_000_000, outputTokens: 0 })
    expect(cost.usd).toBeCloseTo(1.5, 10)
    expect(cost.dkk).toBeCloseTo(1.5 * USD_TO_DKK, 10)
  })

  it('treats missing token counts as zero rather than throwing', () => {
    const cost = computeCost(MODELS.workhorse, { inputTokens: undefined, outputTokens: undefined })
    expect(cost).toMatchObject({ tokensIn: 0, tokensOut: 0, usd: 0, dkk: 0 })
  })

  it('shows sub-krone amounts with enough precision to be non-zero', () => {
    const formatted = formatDkk(0.0091, 'da')
    expect(formatted).toMatch(/0,0091/)
  })
})
