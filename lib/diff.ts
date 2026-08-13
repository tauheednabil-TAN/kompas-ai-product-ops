export type DiffOp = { type: 'equal' | 'insert' | 'delete'; text: string }

/**
 * Tokenise into words *and* the whitespace between them, so reassembling the
 * tokens reproduces the input exactly. A word-only split would silently
 * normalise spacing and make the diff lie about what changed.
 */
function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]+/g) ?? []
}

/**
 * Word-level diff via longest common subsequence.
 *
 * O(n·m) in time and space. That is fine here and nowhere else: both inputs are
 * hard-capped at 8,000 characters (~1,300 tokens) by `MAX_INPUT_CHARS`, so the
 * table stays under two million cells. If that cap ever rises, this needs to
 * become Myers' algorithm.
 */
export function diffWords(before: string, after: string): DiffOp[] {
  const a = tokenize(before)
  const b = tokenize(after)

  // lengths[i][j] = LCS length of a[i..] and b[j..]
  const lengths: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  )

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      const row = lengths[i]
      const next = lengths[i + 1]
      if (!row || !next) continue
      row[j] = a[i] === b[j] ? (next[j + 1] ?? 0) + 1 : Math.max(next[j] ?? 0, row[j + 1] ?? 0)
    }
  }

  const ops: DiffOp[] = []
  const push = (type: DiffOp['type'], text: string) => {
    const last = ops[ops.length - 1]
    // Merge adjacent ops of the same kind so the rendered output is not one
    // <span> per token.
    if (last && last.type === type) last.text += text
    else ops.push({ type, text })
  }

  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('equal', a[i] ?? '')
      i += 1
      j += 1
    } else if ((lengths[i + 1]?.[j] ?? 0) >= (lengths[i]?.[j + 1] ?? 0)) {
      push('delete', a[i] ?? '')
      i += 1
    } else {
      push('insert', b[j] ?? '')
      j += 1
    }
  }
  while (i < a.length) {
    push('delete', a[i] ?? '')
    i += 1
  }
  while (j < b.length) {
    push('insert', b[j] ?? '')
    j += 1
  }

  return ops
}

/**
 * Apply each finding's suggested rewrite to the original note.
 *
 * Only replaces quotes that are a **literal** substring — a paraphrased quote is
 * itself a finding (the model failed its grounding requirement) and must not be
 * silently patched over. Returns which ones could not be applied so the UI can
 * say so out loud.
 */
export function applySuggestions(
  original: string,
  findings: readonly { citat: string; forslag: string }[],
): { rewritten: string; applied: number; unmatched: string[] } {
  let rewritten = original
  let applied = 0
  const unmatched: string[] = []

  for (const finding of findings) {
    if (!finding.citat || !finding.forslag) continue
    if (rewritten.includes(finding.citat)) {
      rewritten = rewritten.replace(finding.citat, finding.forslag)
      applied += 1
    } else {
      unmatched.push(finding.citat)
    }
  }

  return { rewritten, applied, unmatched }
}
