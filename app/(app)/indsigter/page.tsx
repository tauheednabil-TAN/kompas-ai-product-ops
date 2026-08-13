import { Indsigter } from '@/components/pages/indsigter'
import { getInsights } from '@/lib/db/insight-queries'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return <Indsigter result={await getInsights()} />
}
