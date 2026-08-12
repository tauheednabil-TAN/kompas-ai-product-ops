import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { z } from 'zod'
import { containsCpr } from '../lib/ai/guards'
import { feedbackItems } from '../lib/db/schema'

const feedbackSchema = z.array(
  z.object({
    id: z.string(),
    kommune: z.string(),
    kanal: z.string(),
    modtaget: z.string(),
    tekst: z.string(),
  }),
)

async function loadJson(relative: string): Promise<unknown> {
  const file = await readFile(path.join(process.cwd(), relative), 'utf8')
  return JSON.parse(file)
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.')
    process.exit(1)
  }

  const db = drizzle(neon(url))

  const feedback = feedbackSchema.parse(await loadJson('data/seed/feedback.json'))

  /**
   * C2 is not a promise, it is a check. If synthetic seed data ever picked up
   * something CPR-shaped, seeding must fail loudly rather than quietly load it
   * into a demo database.
   */
  const contaminated = feedback.filter((item) => containsCpr(item.tekst))
  if (contaminated.length > 0) {
    console.error(
      `Refusing to seed: ${contaminated.length} item(s) contain something CPR-shaped: ${contaminated
        .map((item) => item.id)
        .join(', ')}`,
    )
    process.exit(1)
  }

  console.log(`Seeding ${feedback.length} feedback items …`)

  await db
    .insert(feedbackItems)
    .values(
      feedback.map((item) => ({
        externalId: item.id,
        kommune: item.kommune,
        product: 'Ukendt',
        channel: item.kanal,
        rawText: item.tekst,
        receivedAt: new Date(item.modtaget),
      })),
    )
    // Re-running the seed must be safe; it is run by hand and after every deploy.
    .onConflictDoNothing({ target: feedbackItems.externalId })

  console.log('Done.')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
