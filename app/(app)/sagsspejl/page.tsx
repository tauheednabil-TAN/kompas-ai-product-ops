import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { Sagsspejl, type SeedNote } from '@/components/pages/sagsspejl'

const seedSchema = z.array(
  z.object({
    id: z.string(),
    titel: z.string(),
    tekst: z.string(),
    syntetisk: z.literal(true),
  }),
)

/**
 * `syntetisk: true` is a `z.literal`, not a boolean. A seed note that is not
 * explicitly marked synthetic fails the build rather than reaching the page —
 * C2 enforced by the type system rather than by a comment.
 */
async function loadNotes(): Promise<SeedNote[]> {
  const file = await readFile(path.join(process.cwd(), 'data/seed/sagsnotater.json'), 'utf8')
  return seedSchema.parse(JSON.parse(file)).map(({ id, titel, tekst }) => ({ id, titel, tekst }))
}

export default async function Page() {
  const notes = await loadNotes()
  return <Sagsspejl notes={notes} />
}
