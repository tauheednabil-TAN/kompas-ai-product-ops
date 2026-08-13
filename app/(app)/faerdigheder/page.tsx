import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { Faerdigheder, type SkillSummary } from '@/components/pages/faerdigheder'
import { skillBuilder } from '@/lib/agents/skill-builder'
import { parseSkill, validateSkill } from '@/lib/skills/validate'

async function loadSkills(): Promise<SkillSummary[]> {
  const dir = path.join(process.cwd(), 'data/skills')
  const files = (await readdir(dir)).filter((file) => file.endsWith('.md'))

  return Promise.all(
    files.map(async (file) => {
      const markdown = await readFile(path.join(dir, file), 'utf8')
      const parsed = parseSkill(markdown)
      return {
        file,
        name: parsed.name ?? file.replace(/\.md$/, ''),
        description: parsed.description ?? '',
        markdown,
        // Shown in the registry, so a seed that stopped meeting the bar is
        // visible rather than quietly assumed fine.
        valid: validateSkill(markdown).valid,
      }
    }),
  )
}

export default async function Page() {
  return (
    <Faerdigheder
      skills={await loadSkills()}
      sampleInput={skillBuilder.sampleInput}
      // C8: with no token the PR button is hidden entirely, not shown broken.
      githubEnabled={Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_SKILLS_REPO)}
    />
  )
}
