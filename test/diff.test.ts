import { describe, expect, it } from 'vitest'
import { applySuggestions, diffWords } from '@/lib/diff'

function reassemble(ops: ReturnType<typeof diffWords>, side: 'before' | 'after'): string {
  return ops
    .filter((op) => op.type === 'equal' || op.type === (side === 'before' ? 'delete' : 'insert'))
    .map((op) => op.text)
    .join('')
}

describe('diffWords', () => {
  it('reproduces both inputs exactly, whitespace included', () => {
    const before = 'Borger  A er fortsat\numotiveret og møder ikke op.'
    const after = 'Borger  A er ikke mødt op til de seneste tre aftaler.'
    const ops = diffWords(before, after)
    expect(reassemble(ops, 'before')).toBe(before)
    expect(reassemble(ops, 'after')).toBe(after)
  })

  it('reports no changes for identical text', () => {
    const ops = diffWords('samme tekst', 'samme tekst')
    expect(ops).toEqual([{ type: 'equal', text: 'samme tekst' }])
  })

  it('merges adjacent operations of the same kind into one span', () => {
    // A word and the whitespace beside it are separate tokens, so without
    // merging this would render as one <del> per token.
    const ops = diffWords('en to tre fire', 'en fire')
    const deletes = ops.filter((op) => op.type === 'delete')
    expect(deletes).toHaveLength(1)
    expect(deletes[0]?.text).toBe('to tre ')
  })

  it('leaves a shared whitespace token between two changes as equal', () => {
    // Tempting to absorb it so "x y" renders as one highlight, but that space
    // exists on both sides. Absorbing it would make the diff misreport the
    // input, and the exactness test above is the more important property.
    const ops = diffWords('a b c', 'a x y c')
    expect(reassemble(ops, 'before')).toBe('a b c')
    expect(reassemble(ops, 'after')).toBe('a x y c')
  })

  it('handles an empty side', () => {
    expect(diffWords('', 'ny tekst')).toEqual([{ type: 'insert', text: 'ny tekst' }])
    expect(diffWords('gammel tekst', '')).toEqual([{ type: 'delete', text: 'gammel tekst' }])
  })
})

describe('applySuggestions', () => {
  const note = 'Borger A er fortsat umotiveret. Der følges op.'

  it('applies a rewrite whose quote is a literal substring', () => {
    const result = applySuggestions(note, [
      { citat: 'er fortsat umotiveret', forslag: 'er ikke mødt til de seneste tre aftaler' },
    ])
    expect(result.rewritten).toBe('Borger A er ikke mødt til de seneste tre aftaler. Der følges op.')
    expect(result.applied).toBe(1)
    expect(result.unmatched).toEqual([])
  })

  it('refuses to patch over a paraphrased quote and reports it', () => {
    // A quote that is not verbatim is itself a finding — the model failed its
    // grounding requirement. Silently fuzzy-matching would hide that.
    const result = applySuggestions(note, [
      { citat: 'Borgeren er umotiveret', forslag: 'noget andet' },
    ])
    expect(result.rewritten).toBe(note)
    expect(result.applied).toBe(0)
    expect(result.unmatched).toEqual(['Borgeren er umotiveret'])
  })

  it('applies several rewrites to the same note', () => {
    const result = applySuggestions(note, [
      { citat: 'umotiveret', forslag: 'ikke mødt' },
      { citat: 'Der følges op.', forslag: 'Der følges op den 1. juni ved undertegnede.' },
    ])
    expect(result.applied).toBe(2)
    expect(result.rewritten).toContain('1. juni')
  })
})
