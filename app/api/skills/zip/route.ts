import JSZip from 'jszip'
import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { NAME_PATTERN, validateSkill } from '@/lib/skills/validate'

export const runtime = 'nodejs'

const bodySchema = z.object({
  name: z.string().regex(NAME_PATTERN),
  markdown: z.string().min(1).max(200_000),
})

/**
 * Package a skill as a downloadable zip.
 *
 * The file is re-validated here rather than trusted from the client: this
 * endpoint is the last point before something leaves the app claiming to be a
 * working skill, and a client can post anything.
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return Response.json({ code: 'bad_request' }, { status: 400 })
  }

  const validation = validateSkill(parsed.data.markdown)
  if (!validation.valid) {
    return Response.json(
      {
        code: 'invalid_skill',
        failed: validation.checks.filter((check) => !check.ok).map((check) => check.id),
      },
      { status: 422 },
    )
  }

  const zip = new JSZip()
  // Claude expects <name>/SKILL.md, so the folder name has to match.
  zip.folder(parsed.data.name)?.file('SKILL.md', parsed.data.markdown)
  const buffer = await zip.generateAsync({ type: 'uint8array' })

  return new Response(buffer as BodyInit, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${parsed.data.name}.zip"`,
      'cache-control': 'no-store',
    },
  })
}
