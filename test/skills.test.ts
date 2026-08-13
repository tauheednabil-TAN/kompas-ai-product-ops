import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  countTriggerPhrases,
  parseSkill,
  validateSkill,
  DESCRIPTION_MAX,
  MIN_TRIGGER_PHRASES,
} from '@/lib/skills/validate'

const VALID = `---
name: kommune-feedback-resume
description: Opsummerer henvendelser fra kommuner til ét statusafsnit. Bruges når brugeren siger "lav et resumé af ugens henvendelser", "hvad har kommunerne skrevet om" eller "opsummer feedback fra support".
---

# Resumé

## Trin

1. Læs alle henvendelser igennem.
2. Grupper dem efter hvad brugeren forsøgte at gøre.

## Eksempel

Input: fire supportsager. Output: ét afsnit.
`

function failed(markdown: string) {
  return validateSkill(markdown)
    .checks.filter((check) => !check.ok)
    .map((check) => check.id)
}

describe('skill validation', () => {
  it('accepts a well-formed skill', () => {
    const result = validateSkill(VALID)
    expect(failed(VALID)).toEqual([])
    expect(result.valid).toBe(true)
    expect(result.parsed.name).toBe('kommune-feedback-resume')
  })

  it('rejects a missing frontmatter block', () => {
    expect(failed('# Bare en overskrift\n\n1. Et trin')).toContain('frontmatter_present')
  })

  it('rejects unparseable YAML', () => {
    const broken = VALID.replace('name: kommune-feedback-resume', 'name: [unclosed')
    expect(failed(broken)).toContain('frontmatter_parses')
  })

  it('rejects a name that is not kebab-case', () => {
    const bad = VALID.replace('kommune-feedback-resume', 'Kommune Feedback Resumé')
    const ids = failed(bad)
    expect(ids).toContain('name_format')
    // The name is present, just wrong — those are different failures.
    expect(ids).not.toContain('name_present')
  })

  it('rejects a description that is too short or too long', () => {
    expect(failed(VALID.replace(/description: .*/, 'description: For kort'))).toContain(
      'description_length',
    )
    const long = VALID.replace(/description: .*/, `description: ${'a'.repeat(DESCRIPTION_MAX + 1)}`)
    expect(failed(long)).toContain('description_length')
  })

  it('rejects a description with too few trigger phrases', () => {
    const vague = VALID.replace(
      /description: .*/,
      'description: Denne færdighed hjælper med at håndtere diverse opgaver i produktteamet.',
    )
    expect(failed(vague)).toContain('description_triggers')
  })

  it('rejects a body with no steps', () => {
    const noSteps = VALID.replace(/1\. Læs.*\n2\. Grupper.*/s, 'Bare noget prosa.\n\n## Eksempel\n\nEt eksempel.')
    expect(failed(noSteps)).toContain('body_steps')
  })

  it('rejects a body with no worked example', () => {
    const noExample = VALID.replace('## Eksempel\n\nInput: fire supportsager. Output: ét afsnit.\n', '')
    expect(failed(noExample)).toContain('body_example')
  })

  it('accepts an English example heading too', () => {
    const english = VALID.replace('## Eksempel', '## Example')
    expect(failed(english)).toEqual([])
  })

  it('reports every failure at once rather than stopping at the first', () => {
    // A checklist is actionable; one error at a time is a guessing game.
    const ids = failed('---\nname: Not Kebab\n---\n\nnothing here')
    expect(ids.length).toBeGreaterThan(3)
  })
})

describe('trigger phrase counting', () => {
  it('counts quoted phrases', () => {
    expect(
      countTriggerPhrases('Bruges når brugeren siger "lav et resumé", "opsummer ugen" eller "hvad skete der".'),
    ).toBeGreaterThanOrEqual(MIN_TRIGGER_PHRASES)
  })

  it('counts comma-separated clauses after a trigger word', () => {
    expect(
      countTriggerPhrases(
        'Bruges når brugeren beder om release notes, indsætter en liste af commits, eller spørger hvad kunderne skal vide.',
      ),
    ).toBeGreaterThanOrEqual(MIN_TRIGGER_PHRASES)
  })

  it('does not credit vague prose', () => {
    expect(countTriggerPhrases('Hjælper med diverse opgaver.')).toBeLessThan(MIN_TRIGGER_PHRASES)
  })
})

describe('skill parsing', () => {
  it('separates frontmatter from body', () => {
    const parsed = parseSkill(VALID)
    expect(parsed.frontmatterYaml).toContain('name:')
    expect(parsed.bodyMd.startsWith('# Resumé')).toBe(true)
    expect(parsed.bodyMd).not.toContain('---')
  })

  it('treats a file with no frontmatter as all body', () => {
    const parsed = parseSkill('# Kun brødtekst')
    expect(parsed.name).toBeNull()
    expect(parsed.bodyMd).toBe('# Kun brødtekst')
  })
})

describe('seeded skills', () => {
  const dir = path.join(process.cwd(), 'data/skills')
  const files = readdirSync(dir).filter((file) => file.endsWith('.md'))

  it('ships three hand-written skills so the registry is never empty', () => {
    expect(files).toHaveLength(3)
  })

  for (const file of files) {
    it(`${file} passes the project's own validator`, () => {
      // The generator is validated against the same rules the seeds must meet.
      // If the seeds could not pass, the bar would be dishonest.
      const result = validateSkill(readFileSync(path.join(dir, file), 'utf8'))
      const failures = result.checks.filter((check) => !check.ok)
      expect(failures.map((f) => `${f.id}: ${f.detail}`)).toEqual([])
    })

    it(`${file} has a filename matching its declared name`, () => {
      const parsed = parseSkill(readFileSync(path.join(dir, file), 'utf8'))
      expect(`${parsed.name}.md`).toBe(file)
    })
  }
})
