'use client'

import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Chip, StatusChip, VerdictChip } from '@/components/ui/chip'
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
  Skeleton,
} from '@/components/ui/panel'
import { Sheet } from '@/components/ui/sheet'
import { Mono, TableWrap, Td, Th, Thead, Tr } from '@/components/ui/table'
import { useT } from '@/lib/i18n/provider'

/**
 * Class names are written out in full, never interpolated. Tailwind scans source
 * text for literal class strings, so `bg-${name}` would silently produce no CSS
 * at all — and this page would then be lying about the tokens it claims to show.
 */
const SURFACES: readonly [string, string][] = [
  ['bg', 'bg-bg'],
  ['surface', 'bg-surface'],
  ['surface-sunk', 'bg-surface-sunk'],
  ['border', 'bg-border'],
  ['border-strong', 'bg-border-strong'],
]

const SEMANTIC: readonly [string, string][] = [
  ['accent', 'bg-accent'],
  ['accent-soft', 'bg-accent-soft'],
  ['ok', 'bg-ok'],
  ['ok-soft', 'bg-ok-soft'],
  ['warn', 'bg-warn'],
  ['warn-soft', 'bg-warn-soft'],
  ['danger', 'bg-danger'],
  ['danger-soft', 'bg-danger-soft'],
  ['info', 'bg-info'],
  ['info-soft', 'bg-info-soft'],
]

const INKS: readonly [string, string][] = [
  ['ink', 'text-ink'],
  ['ink-muted', 'text-ink-muted'],
  ['ink-faint', 'text-ink-faint'],
]

/**
 * Every component in one place, in whichever theme is active. This page is the
 * project's own visual regression check: if a token drifts or a component stops
 * matching the system, it shows up here first.
 */
export function DesignGallery() {
  const t = useT()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <PageHeader title={t.design.title} subtitle={t.design.subtitle} />

      <div className="flex flex-col gap-8">
        <Panel>
          <PanelHeader>
            <PanelTitle>{t.design.colours}</PanelTitle>
          </PanelHeader>
          <PanelBody className="flex flex-col gap-5">
            <p className="max-w-[68ch] text-ink-muted">{t.design.semanticRule}</p>

            <div className="flex flex-wrap gap-3">
              {SURFACES.map(([name, className]) => (
                <Swatch key={name} name={name} className={className} />
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {SEMANTIC.map(([name, className]) => (
                <Swatch key={name} name={name} className={className} />
              ))}
            </div>

            <div className="flex flex-wrap items-baseline gap-5">
              {INKS.map(([name, className]) => (
                <span key={name} className={className}>
                  {name}
                </span>
              ))}
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>{t.design.typography}</PanelTitle>
          </PanelHeader>
          <PanelBody className="flex flex-col gap-3">
            <p className="text-3xl font-semibold">32 · Sundhedsfaglig dokumentationskvalitet</p>
            <p className="text-2xl font-semibold">26 · Selvbetjeningsløsning</p>
            <p className="text-xl font-semibold">20 · Overskrift</p>
            <p className="text-lg">16 · Lang dansk brødtekst</p>
            <p className="text-base">14 · Brødtekst i grænsefladen</p>
            <p className="text-sm text-ink-muted">13 · Sekundær tekst</p>
            <p className="text-xs text-ink-muted">12 · Tabelhoved</p>
            <p className="text-2xs text-ink-faint">11 · Metadata</p>
            <p className="tabular font-mono text-xs">
              0123456789 · gemini-3.6-flash · 1 482 / 396 tokens
            </p>
            <p className="prose-da border-t border-border pt-4 text-ink-muted">
              Kompas vurderer dokumentationens form og fuldstændighed — ikke den socialfaglige
              vurdering. Den faglige beslutning er altid sagsbehandlerens. Denne linje findes her,
              fordi den er projektets længste sammensatte navneord samlet ét sted, og fordi
              orddeling skal testes med rigtig tekst.
            </p>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>{t.design.buttons}</PanelTitle>
          </PanelHeader>
          <PanelBody className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primær</Button>
            <Button variant="secondary">Sekundær</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Destruktiv</Button>
            <Button variant="primary" size="sm">
              Lille
            </Button>
            <Button variant="secondary" disabled>
              Deaktiveret
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              Åbn panel
            </Button>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>{t.design.badges}</PanelTitle>
          </PanelHeader>
          <PanelBody className="flex flex-wrap items-center gap-3">
            <Chip tone="accent">Aktiv</Chip>
            <Chip tone="ok">Bestået</Chip>
            <Chip tone="warn">Kræver gennemsyn</Chip>
            <Chip tone="danger">Fejlet</Chip>
            <Chip tone="info">Information</Chip>
            <Chip tone="neutral">Neutral</Chip>
            <StatusChip status="ok" label={t.status.ok} />
            <StatusChip status="error" label={t.status.error} />
            <StatusChip status="blocked" label={t.status.blocked} />
            <VerdictChip verdict="pending" label={t.verdict.pending} />
            <VerdictChip verdict="accepted" label={t.verdict.accepted} />
            <VerdictChip verdict="edited" label={t.verdict.edited} />
            <VerdictChip verdict="rejected" label={t.verdict.rejected} />
            {/* Scores always show the number AND a state chip — never a bare dot. */}
            <span className="tabular inline-flex items-center gap-2 text-ink">
              4,6 / 5 <Chip tone="ok">Bestået</Chip>
            </span>
          </PanelBody>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader>
            <PanelTitle>{t.design.tables}</PanelTitle>
          </PanelHeader>
          <TableWrap>
            <Thead>
              <Tr>
                <Th>Sag</Th>
                <Th>Model</Th>
                <Th className="text-right">Tokens</Th>
                <Th className="text-right">Omkostning</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <tbody>
              {[
                { id: 'ft-001', tokens: '1 482 / 396', cost: '0,0312 kr.', status: 'ok' as const },
                { id: 'ft-002', tokens: '2 041 / 512', cost: '0,0441 kr.', status: 'error' as const },
                { id: 'ft-003', tokens: '0 / 0', cost: '0,0000 kr.', status: 'blocked' as const },
              ].map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <Mono>{row.id}</Mono>
                  </Td>
                  <Td>
                    <Mono>gemini-3.6-flash</Mono>
                  </Td>
                  <Td className="tabular text-right">
                    <Mono>{row.tokens}</Mono>
                  </Td>
                  <Td className="tabular text-right">{row.cost}</Td>
                  <Td>
                    <StatusChip status={row.status} label={t.status[row.status]} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>{t.design.states}</PanelTitle>
          </PanelHeader>
          <PanelBody className="flex flex-col gap-4">
            <Alert tone="info" title="Information">
              Sagsspejl vurderer dokumentationens form — ikke den socialfaglige vurdering.
            </Alert>
            <Alert tone="warn" title="Kræver gennemsyn">
              To eval-cases er markeret som ustabile. En ustabil case betyder en tvetydig rubrik.
            </Alert>
            <Alert tone="danger" title="Kunne ikke nå Gemini-API'et (429 – for mange kald)">
              Prøv igen om 30 sekunder.
            </Alert>

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs text-ink-faint">Skeletter</p>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-2/3" />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs text-ink-faint">Streaming</p>
              <p className="caret text-ink">Modellen skriver netop nu</p>
            </div>

            <div className="border-t border-border">
              <EmptyState
                message="Der er endnu ingen kørsler at vise. Kør en agent, så lander den her."
                action={
                  <Button variant="primary" size="sm">
                    Gå til Agenter
                  </Button>
                }
              />
            </div>
          </PanelBody>
        </Panel>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Detaljepanel"
        description="Drill-down uden at miste listen bagved"
        closeLabel={t.common.close}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSheetOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm">
              {t.common.save}
            </Button>
          </div>
        }
      >
        <p className="text-ink-muted">
          Et panel glider ind fra højre, så brugeren aldrig mister sin plads i listen bagved.
          Bevægelsen er 180 ms og kun opacity og transform.
        </p>
      </Sheet>
    </>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex w-[132px] flex-col gap-1.5">
      <div className={`h-12 rounded-[8px] border border-border ${className}`} />
      <span className="font-mono text-2xs text-ink-muted">{name}</span>
    </div>
  )
}
