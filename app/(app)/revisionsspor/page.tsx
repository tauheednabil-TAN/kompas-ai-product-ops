import { AuditLog } from '@/components/pages/audit-log'
import { listAgentRuns } from '@/lib/db/queries'

// Every visit must show the true current state of the log; nothing here is
// cacheable by definition.
export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await listAgentRuns(200)
  return <AuditLog result={result} />
}
