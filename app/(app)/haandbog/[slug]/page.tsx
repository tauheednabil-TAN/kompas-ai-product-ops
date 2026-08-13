import { notFound } from 'next/navigation'
import { HaandbogChapter } from '@/components/pages/haandbog'
import { CHAPTERS, getChapter } from '@/lib/haandbog'

export function generateStaticParams() {
  return CHAPTERS.map((chapter) => ({ slug: chapter.slug }))
}

export default async function Page(props: PageProps<'/haandbog/[slug]'>) {
  const { slug } = await props.params

  // /haandbog/design is a real sibling route with its own page; anything else
  // must be a chapter or a 404.
  const chapter = getChapter(slug)
  if (!chapter) notFound()

  return <HaandbogChapter chapter={chapter} />
}
