'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { PageHeader, Panel, PanelBody } from '@/components/ui/panel'
import { CHAPTERS, type Block, type Chapter } from '@/lib/haandbog'
import { useT } from '@/lib/i18n/provider'

export function HaandbogIndex() {
  const t = useT()

  return (
    <>
      <PageHeader title={t.modules.haandbog.title} subtitle={t.modules.haandbog.subtitle} />

      <div className="flex flex-col gap-3">
        {CHAPTERS.map((chapter, index) => (
          <Panel key={chapter.slug} className="transition-colors duration-[120ms] hover:border-border-strong">
            <Link href={`/haandbog/${chapter.slug}`} className="flex items-start gap-4 p-5">
              <span className="tabular mt-0.5 font-mono text-xs text-ink-faint">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">{chapter.title}</span>
                <span className="mt-1 block max-w-[68ch] text-ink-muted">{chapter.summary}</span>
              </span>
              <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-faint" />
            </Link>
          </Panel>
        ))}

        <Panel className="transition-colors duration-[120ms] hover:border-border-strong">
          <Link href="/haandbog/design" className="flex items-start gap-4 p-5">
            <span className="tabular mt-0.5 font-mono text-xs text-ink-faint">—</span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-ink">{t.design.title}</span>
              <span className="mt-1 block max-w-[68ch] text-ink-muted">{t.design.subtitle}</span>
            </span>
            <ArrowRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-faint" />
          </Link>
        </Panel>
      </div>
    </>
  )
}

export function HaandbogChapter({ chapter }: { chapter: Chapter }) {
  return (
    <>
      <PageHeader title={chapter.title} subtitle={chapter.summary} />
      <Panel>
        <PanelBody className="flex flex-col gap-5">
          {chapter.blocks.map((block, index) => (
            <BlockView key={index} block={block} />
          ))}
        </PanelBody>
      </Panel>
      <p className="mt-6">
        <Link href="/haandbog" className="text-xs font-medium text-accent hover:text-accent-hover">
          ← {CHAPTERS[0] ? 'Håndbog' : ''}
        </Link>
      </p>
    </>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="mt-2 text-xl font-semibold text-ink">{block.text}</h2>

    case 'p':
      // Long-form Danish prose: 16px / 1.65 / max 68ch.
      return <p className="prose-da text-ink-muted">{block.text}</p>

    case 'ul':
      return (
        <ul className="prose-da flex list-disc flex-col gap-2 pl-5 text-ink-muted marker:text-ink-faint">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="prose-da flex list-decimal flex-col gap-2 pl-5 text-ink-muted marker:text-ink-faint">
          {block.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ol>
      )

    case 'callout':
      return (
        <Alert tone={block.tone} title={block.title}>
          <p className="max-w-[68ch]">{block.text}</p>
        </Alert>
      )

    case 'compare':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[8px] border border-danger/30 bg-danger-soft p-3">
            <p className="mb-1.5 text-xs font-medium text-danger">{block.badTitle}</p>
            <p className="whitespace-pre-wrap text-ink-muted">{block.bad}</p>
          </div>
          <div className="rounded-[8px] border border-ok/30 bg-ok-soft p-3">
            <p className="mb-1.5 text-xs font-medium text-ok">{block.goodTitle}</p>
            <p className="whitespace-pre-wrap text-ink-muted">{block.good}</p>
          </div>
        </div>
      )
  }
}
