/**
 * Input guards. Constraint C2.
 *
 * These run *before* any model call, never after. A CPR number that reaches the
 * provider has already left the building; blocking it afterwards would be
 * theatre.
 */

/**
 * Danish CPR: DDMMYY-SSSS, optionally without the hyphen.
 *
 * `\b` on both ends so a 10-digit substring of a longer number (an order id, a
 * phone number run together) does not match.
 */
const CPR_PATTERN = /\b(\d{2})(\d{2})(\d{2})-?(\d{4})\b/g

/**
 * The classic modulo-11 control. Note it is **not** a validity test in 2026:
 * since 2007 CPR numbers have been issued that deliberately fail it, because the
 * number space ran out. It is used here only to *raise* confidence, never to
 * clear a number — anything that looks like a CPR is blocked either way.
 */
const WEIGHTS = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]

function passesModulo11(digits: string): boolean {
  if (digits.length !== 10) return false
  let sum = 0
  for (let i = 0; i < 10; i += 1) {
    const digit = Number(digits[i])
    const weight = WEIGHTS[i]
    if (Number.isNaN(digit) || weight === undefined) return false
    sum += digit * weight
  }
  return sum % 11 === 0
}

/** A plausible date is a much stronger signal than the checksum. */
function plausibleDate(dd: string, mm: string): boolean {
  const day = Number(dd)
  const month = Number(mm)
  return day >= 1 && day <= 31 && month >= 1 && month <= 12
}

export type CprMatch = {
  /** Character offset in the input. */
  index: number
  /** The matched text, kept only long enough to highlight it client-side. */
  text: string
  /** True when the number also satisfies modulo-11. Reporting only. */
  checksumValid: boolean
}

/**
 * Finds anything CPR-shaped.
 *
 * Errs toward false positives on purpose. A blocked paste costs the user five
 * seconds; a leaked CPR number in a demo of a public-sector tool costs the
 * project. The date plausibility check is the only filter applied — it removes
 * things like "20231231-0000" runs of digits that are obviously not birthdays.
 */
export function findCprNumbers(text: string): CprMatch[] {
  const matches: CprMatch[] = []
  // The regex is module-level and /g, so reset before each use.
  CPR_PATTERN.lastIndex = 0

  let match: RegExpExecArray | null = CPR_PATTERN.exec(text)
  while (match !== null) {
    const [full, dd, mm, yy, serial] = match
    if (dd && mm && yy && serial && plausibleDate(dd, mm)) {
      matches.push({
        index: match.index,
        text: full,
        checksumValid: passesModulo11(`${dd}${mm}${yy}${serial}`),
      })
    }
    match = CPR_PATTERN.exec(text)
  }

  return matches
}

export function containsCpr(text: string): boolean {
  return findCprNumbers(text).length > 0
}

/** Hard cap shared by every free-text surface. */
export const MAX_INPUT_CHARS = 8000

export type GuardResult =
  | { ok: true }
  | { ok: false; code: 'cpr_blocked'; matches: CprMatch[] }
  | { ok: false; code: 'too_long'; length: number }

export function guardInput(text: string): GuardResult {
  if (text.length > MAX_INPUT_CHARS) {
    return { ok: false, code: 'too_long', length: text.length }
  }
  const matches = findCprNumbers(text)
  if (matches.length > 0) {
    return { ok: false, code: 'cpr_blocked', matches }
  }
  return { ok: true }
}

/**
 * Output-side check. Belt and braces: even though nothing CPR-shaped can reach
 * the model, a model can still hallucinate one into its output, and that must
 * never be persisted or shown.
 */
export function outputContainsCpr(output: unknown): boolean {
  return containsCpr(JSON.stringify(output))
}
