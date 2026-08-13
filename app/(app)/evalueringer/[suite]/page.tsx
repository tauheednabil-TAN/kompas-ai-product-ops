import { EvalSuiteDetail } from '@/components/pages/eval-suite-detail'
import { getSuiteDetail } from '@/lib/db/eval-queries'

export const dynamic = 'force-dynamic'

export default async function Page(props: PageProps<'/evalueringer/[suite]'>) {
  const { suite } = await props.params
  const { version } = await props.searchParams
  return (
    <EvalSuiteDetail
      result={await getSuiteDetail(suite, typeof version === 'string' ? version : undefined)}
    />
  )
}
