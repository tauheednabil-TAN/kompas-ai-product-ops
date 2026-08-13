import { EvalCompare } from '@/components/pages/eval-compare'
import { getComparison } from '@/lib/db/eval-queries'

export const dynamic = 'force-dynamic'

export default async function Page(props: PageProps<'/evalueringer/[suite]/sammenlign'>) {
  const { suite } = await props.params
  const search = await props.searchParams

  const a = typeof search.a === 'string' ? search.a : undefined
  const b = typeof search.b === 'string' ? search.b : undefined

  // Both versions must be named explicitly. Guessing which two to compare would
  // silently show a different pair than the one linked to.
  if (!a || !b) {
    return <EvalCompare result={{ state: 'ok', data: null }} />
  }

  return <EvalCompare result={await getComparison(suite, a, b)} />
}
