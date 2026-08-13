/**
 * Danish-vs-English detection for free-text model output.
 *
 * Deliberately a heuristic and not a library: the only question being asked is
 * "did the model answer in the language it was told to", and that failure mode
 * is loud — a drifted answer is *entirely* English, never subtly so. A
 * probabilistic language model would add a dependency and a failure mode
 * (short strings) for no extra signal.
 *
 * §9 names this as the mitigation for Danish output drifting to English, and it
 * is wired in as a deterministic check so it can never silently regress.
 */

const DANISH_STOPWORDS = new Set([
  'og', 'i', 'at', 'det', 'en', 'den', 'til', 'er', 'som', 'på', 'de', 'med',
  'af', 'for', 'ikke', 'der', 'var', 'men', 'et', 'har', 'om', 'vi', 'kan',
  'skal', 'ved', 'fra', 'blev', 'være', 'bliver', 'hvis', 'når', 'eller',
  'også', 'efter', 'under', 'mellem', 'samt', 'derfor', 'fordi', 'ingen',
  'flere', 'andre', 'sin', 'sine', 'deres', 'hun', 'han', 'borgeren', 'notatet',
])

const ENGLISH_STOPWORDS = new Set([
  'the', 'of', 'and', 'to', 'in', 'is', 'that', 'it', 'for', 'was', 'with',
  'as', 'on', 'be', 'at', 'by', 'this', 'have', 'from', 'or', 'an', 'they',
  'which', 'you', 'we', 'all', 'there', 'been', 'if', 'more', 'when', 'will',
  'would', 'who', 'has', 'its', 'are', 'not', 'but', 'what', 'some', 'can',
  'their', 'about', 'into', 'than', 'only', 'could', 'should', 'must', 'does',
])

export type LanguageVerdict = {
  language: 'da' | 'en' | 'ukendt'
  danishHits: number
  englishHits: number
  hasDanishLetters: boolean
  wordCount: number
}

export function detectLanguage(text: string): LanguageVerdict {
  const words = text.toLowerCase().match(/[\p{L}]+/gu) ?? []

  let danishHits = 0
  let englishHits = 0
  for (const word of words) {
    if (DANISH_STOPWORDS.has(word)) danishHits += 1
    if (ENGLISH_STOPWORDS.has(word)) englishHits += 1
  }

  const hasDanishLetters = /[æøåÆØÅ]/.test(text)

  // Too little text to judge. Saying "ukendt" is better than guessing, because
  // a wrong guess here fails an otherwise good eval case.
  if (words.length < 8) {
    return { language: 'ukendt', danishHits, englishHits, hasDanishLetters, wordCount: words.length }
  }

  // æøå is close to conclusive on its own: English text does not contain them,
  // and Danish prose of any length almost always does.
  if (hasDanishLetters && danishHits >= englishHits) {
    return { language: 'da', danishHits, englishHits, hasDanishLetters, wordCount: words.length }
  }

  if (englishHits > danishHits) {
    return { language: 'en', danishHits, englishHits, hasDanishLetters, wordCount: words.length }
  }
  if (danishHits > englishHits) {
    return { language: 'da', danishHits, englishHits, hasDanishLetters, wordCount: words.length }
  }

  return { language: 'ukendt', danishHits, englishHits, hasDanishLetters, wordCount: words.length }
}

/**
 * Collect every free-text string in a structured output.
 *
 * Enum values are excluded by the caller passing only the fields that carry
 * prose — enums are canonical Danish keys and would otherwise make an English
 * answer look Danish.
 */
export function collectStrings(value: unknown, skipKeys: ReadonlySet<string> = new Set()): string[] {
  const out: string[] = []

  const walk = (node: unknown, key?: string) => {
    if (typeof node === 'string') {
      if (!key || !skipKeys.has(key)) out.push(node)
      return
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item, key)
      return
    }
    if (typeof node === 'object' && node !== null) {
      for (const [childKey, child] of Object.entries(node)) walk(child, childKey)
    }
  }

  walk(value)
  return out
}
