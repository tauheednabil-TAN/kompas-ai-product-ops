import { parse as parseYaml } from 'yaml'

/**
 * Validation for generated Claude skills.
 *
 * Runs *before* anything is shown to the user. A generator that emits a
 * plausible-looking but invalid SKILL.md is worse than one that emits nothing,
 * because the invalidity is only discovered later by whoever tries to use it.
 *
 * Results are a checklist, not a blob of errors — a list of specific things that
 * are or are not true is actionable; a stack of red text is not.
 */

export type CheckId =
  | 'frontmatter_present'
  | 'frontmatter_parses'
  | 'name_present'
  | 'name_format'
  | 'description_present'
  | 'description_length'
  | 'description_triggers'
  | 'body_present'
  | 'body_steps'
  | 'body_example'

export type CheckOutcome = {
  id: CheckId
  ok: boolean
  /** Filled only when the check failed; explains what to change. */
  detail?: string
}

export type ParsedSkill = {
  frontmatterYaml: string
  bodyMd: string
  name: string | null
  description: string | null
}

export type ValidationResult = {
  valid: boolean
  checks: CheckOutcome[]
  parsed: ParsedSkill
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

/** Names must be kebab-case: lowercase letters, digits and hyphens only. */
export const NAME_PATTERN = /^[a-z0-9-]+$/

export const DESCRIPTION_MIN = 20
export const DESCRIPTION_MAX = 500
export const MIN_TRIGGER_PHRASES = 3

/**
 * Trigger phrases are what a description is actually *for*: they decide whether
 * the skill fires at the right moment. Counting quoted phrases and
 * comma-separated clauses is a rough proxy, but it reliably separates
 * "Use when the user asks to X, mentions Y, or says Z" from "Helps with stuff".
 */
export function countTriggerPhrases(description: string): number {
  const quoted = description.match(/["'“”„][^"'“”„]{3,}["'“”„]/g) ?? []
  if (quoted.length >= MIN_TRIGGER_PHRASES) return quoted.length

  const afterTrigger = description.split(/\b(?:when|whenever|hvis|når|trigger[s]?|udløses)\b/i)[1]
  const clauses = (afterTrigger ?? description)
    .split(/,| or | eller |;/i)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length >= 8)

  return Math.max(quoted.length, clauses.length)
}

export function parseSkill(markdown: string): ParsedSkill {
  const match = FRONTMATTER.exec(markdown.trim())
  if (!match) {
    return { frontmatterYaml: '', bodyMd: markdown.trim(), name: null, description: null }
  }

  const [, frontmatterYaml = '', bodyMd = ''] = match

  let name: string | null = null
  let description: string | null = null
  try {
    const data: unknown = parseYaml(frontmatterYaml)
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      name = typeof record.name === 'string' ? record.name : null
      description = typeof record.description === 'string' ? record.description : null
    }
  } catch {
    // Reported by the frontmatter_parses check below.
  }

  return { frontmatterYaml, bodyMd: bodyMd.trim(), name, description }
}

export function validateSkill(markdown: string): ValidationResult {
  const parsed = parseSkill(markdown)
  const checks: CheckOutcome[] = []

  const hasFrontmatter = FRONTMATTER.test(markdown.trim())
  checks.push({
    id: 'frontmatter_present',
    ok: hasFrontmatter,
    detail: hasFrontmatter ? undefined : 'Filen skal starte med en YAML-blok afgrænset af ---',
  })

  let yamlParses = false
  if (hasFrontmatter) {
    try {
      parseYaml(parsed.frontmatterYaml)
      yamlParses = true
    } catch (error) {
      yamlParses = false
      checks.push({
        id: 'frontmatter_parses',
        ok: false,
        detail: error instanceof Error ? error.message : 'YAML kunne ikke læses',
      })
    }
  }
  if (yamlParses) checks.push({ id: 'frontmatter_parses', ok: true })
  else if (!hasFrontmatter) checks.push({ id: 'frontmatter_parses', ok: false })

  const name = parsed.name
  checks.push({
    id: 'name_present',
    ok: Boolean(name),
    detail: name ? undefined : 'Feltet name mangler i frontmatter',
  })
  checks.push({
    id: 'name_format',
    ok: Boolean(name && NAME_PATTERN.test(name)),
    detail:
      name && !NAME_PATTERN.test(name)
        ? `"${name}" skal være kebab-case: kun små bogstaver, tal og bindestreger`
        : undefined,
  })

  const description = parsed.description
  checks.push({
    id: 'description_present',
    ok: Boolean(description),
    detail: description ? undefined : 'Feltet description mangler i frontmatter',
  })

  const length = description?.length ?? 0
  const lengthOk = length >= DESCRIPTION_MIN && length <= DESCRIPTION_MAX
  checks.push({
    id: 'description_length',
    ok: lengthOk,
    detail: lengthOk
      ? undefined
      : `Beskrivelsen er ${length} tegn. Den skal være mellem ${DESCRIPTION_MIN} og ${DESCRIPTION_MAX}.`,
  })

  const triggers = description ? countTriggerPhrases(description) : 0
  checks.push({
    id: 'description_triggers',
    ok: triggers >= MIN_TRIGGER_PHRASES,
    detail:
      triggers >= MIN_TRIGGER_PHRASES
        ? undefined
        : `Der blev fundet ${triggers} konkrete udløsende formuleringer. Der skal være mindst ${MIN_TRIGGER_PHRASES}, så færdigheden aktiveres på det rigtige tidspunkt.`,
  })

  const body = parsed.bodyMd
  checks.push({
    id: 'body_present',
    ok: body.length > 0,
    detail: body.length > 0 ? undefined : 'Brødteksten er tom',
  })

  const hasSteps = /^\s*(?:\d+\.|[-*])\s+/m.test(body)
  checks.push({
    id: 'body_steps',
    ok: hasSteps,
    detail: hasSteps ? undefined : 'Brødteksten skal indeholde nummererede trin eller en punktliste',
  })

  const hasExample = /^#{1,6}\s.*(?:eksempel|example)/im.test(body)
  checks.push({
    id: 'body_example',
    ok: hasExample,
    detail: hasExample ? undefined : 'Brødteksten skal have et afsnit med et gennemarbejdet eksempel',
  })

  return { valid: checks.every((check) => check.ok), checks, parsed }
}

export const CHECK_LABELS: Record<CheckId, { da: string; en: string }> = {
  frontmatter_present: { da: 'Frontmatter findes', en: 'Frontmatter present' },
  frontmatter_parses: { da: 'Frontmatter kan læses som YAML', en: 'Frontmatter parses as YAML' },
  name_present: { da: 'name er udfyldt', en: 'name is set' },
  name_format: { da: 'name er kebab-case', en: 'name is kebab-case' },
  description_present: { da: 'description er udfyldt', en: 'description is set' },
  description_length: { da: 'description er 20–500 tegn', en: 'description is 20–500 characters' },
  description_triggers: {
    da: 'description har mindst 3 udløsende formuleringer',
    en: 'description has at least 3 trigger phrases',
  },
  body_present: { da: 'Brødtekst findes', en: 'Body present' },
  body_steps: { da: 'Brødtekst har trin', en: 'Body has steps' },
  body_example: { da: 'Brødtekst har et eksempel', en: 'Body has a worked example' },
}
