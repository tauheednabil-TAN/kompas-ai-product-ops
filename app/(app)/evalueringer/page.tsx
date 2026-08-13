import { EvalSuites } from '@/components/pages/eval-suites'
import { listSuites } from '@/lib/db/eval-queries'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return <EvalSuites result={await listSuites()} />
}
