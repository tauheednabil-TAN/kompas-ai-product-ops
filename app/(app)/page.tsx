import { Overblik } from '@/components/pages/overblik'
import { getOverviewStats } from '@/lib/db/queries'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await getOverviewStats()
  return <Overblik result={result} />
}
