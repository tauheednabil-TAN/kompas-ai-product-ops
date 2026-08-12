import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { containsCpr, findCprNumbers, guardInput, MAX_INPUT_CHARS, outputContainsCpr } from '@/lib/ai/guards'

describe('CPR detector', () => {
  // The five variants the acceptance criteria call for.
  const variants: [string, string][] = [
    ['hyphenated', 'Borgeren 010190-1234 har henvendt sig.'],
    ['no hyphen', 'Borgeren 0101901234 har henvendt sig.'],
    ['mid-sentence, no surrounding space', 'CPR:070586-4321.'],
    ['start of string', '311279-9876 er registreret i systemet.'],
    ['inside a longer note', 'Der er lavet opfølgning.\nCPR 240771-0101\nNæste møde er aftalt.'],
  ]

  for (const [label, text] of variants) {
    it(`blocks the ${label} variant`, () => {
      expect(containsCpr(text)).toBe(true)
      const result = guardInput(text)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.code).toBe('cpr_blocked')
    })
  }

  it('reports the offset so the client can highlight it', () => {
    const matches = findCprNumbers('Note: 010190-1234 findes her.')
    expect(matches).toHaveLength(1)
    expect(matches[0]?.index).toBe(6)
    expect(matches[0]?.text).toBe('010190-1234')
  })

  it('reports checksum validity without relying on it to clear a number', () => {
    // Since 2007 CPR numbers have been issued that deliberately fail modulo-11,
    // so a failing checksum must never mean "not a CPR number".
    const matches = findCprNumbers('010190-1235')
    expect(matches).toHaveLength(1)
    expect(matches[0]?.checksumValid).toBe(false)
    expect(containsCpr('010190-1235')).toBe(true)
  })

  it('does not fire on other 10-digit strings', () => {
    // Impossible day and month, so not a birthday.
    expect(containsCpr('Ordrenummer 991399-0001 er afsendt.')).toBe(false)
    // Part of a longer digit run — the word boundary must prevent a match.
    expect(containsCpr('Reference 123456789012345')).toBe(false)
  })

  it('finds every occurrence, not just the first', () => {
    expect(findCprNumbers('010190-1234 og 020291-4321')).toHaveLength(2)
  })

  it('is not affected by regex lastIndex between calls', () => {
    const text = '010190-1234'
    expect(containsCpr(text)).toBe(true)
    expect(containsCpr(text)).toBe(true)
    expect(containsCpr(text)).toBe(true)
  })
})

describe('input guard', () => {
  it('rejects text over the cap', () => {
    const result = guardInput('a'.repeat(MAX_INPUT_CHARS + 1))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('too_long')
  })

  it('accepts ordinary Danish case text', () => {
    expect(guardInput('Borger A har fået bevilget § 85-støtte i 6 måneder.').ok).toBe(true)
  })
})

describe('output guard', () => {
  it('catches a CPR number hallucinated into structured output', () => {
    expect(outputContainsCpr({ citat: 'Borgeren 010190-1234 nævnte det' })).toBe(true)
    expect(outputContainsCpr({ citat: 'Borgeren nævnte det' })).toBe(false)
  })
})

describe('seed data', () => {
  const feedback: { id: string; tekst: string }[] = JSON.parse(
    readFileSync(path.join(process.cwd(), 'data/seed/feedback.json'), 'utf8'),
  )

  it('has 30 items', () => {
    expect(feedback).toHaveLength(30)
  })

  it('contains nothing CPR-shaped', () => {
    const contaminated = feedback.filter((item) => containsCpr(item.tekst)).map((item) => item.id)
    expect(contaminated).toEqual([])
  })

  it('has unique ids', () => {
    expect(new Set(feedback.map((item) => item.id)).size).toBe(feedback.length)
  })

  it('varies in length, so the demo is not uniformly easy', () => {
    // A seed set of uniformly short, uniformly tidy items makes every agent look
    // good and proves nothing. The spec asks for 40 to 600 words.
    const lengths = feedback.map((item) => item.tekst.split(/\s+/).length)
    expect(Math.min(...lengths)).toBeLessThan(45)
    expect(Math.max(...lengths)).toBeGreaterThan(250)
  })
})
