import Link from 'next/link'
import { forbidden, unstable_rethrow } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { linkedEntities, type LinkedEntity } from '@/lib/entities'
import { formatNumber, formatTaka, formatWhen } from '@/lib/format'
import type { Language } from '@/lib/language'
import { getLanguage } from '@/lib/language'
import { messages, type Messages } from '@/lib/messages'
import { createClient } from '@/lib/supabase/server'

type ReportStatus = keyof Messages['myReports']['status']

type QueueReport = {
  id: string
  description: string
  amount_lost: number | string | null
  status: ReportStatus
  occurred_on: string
  admin_notes: string | null
  created_at: string
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  await requireAdmin('/admin')
  const params = await searchParams
  const lang = await getLanguage()
  const copy = messages[lang]
  const loaded = await loadQueue()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{copy.admin.title}</h1>
      <p className="mt-2 text-muted">{copy.admin.lede}</p>

      {params.error ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {copy.admin.detail.errors.missing}
        </p>
      ) : null}

      {loaded === null ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {copy.admin.loadError}
        </p>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-3">
            <Count label={copy.myReports.status.pending} value={loaded.pending} lang={lang} />
            <Count label={copy.myReports.status.needs_info} value={loaded.needsInfo} lang={lang} />
          </ul>

          {loaded.queue.length === 0 ? (
            <p className="mt-8 text-muted">{copy.admin.empty}</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {loaded.queue.map((report) => (
                <li key={report.id}>
                  <ReportCard report={report} copy={copy} lang={lang} />
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-12 text-xl font-semibold">{copy.admin.approvedTitle}</h2>
          <p className="mt-2 text-muted">{copy.admin.approvedLede}</p>
          {loaded.approved.length === 0 ? (
            <p className="mt-6 text-muted">{copy.admin.approvedEmpty}</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {loaded.approved.map((report) => (
                <li key={report.id}>
                  <ReportCard report={report} copy={copy} lang={lang} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}

function Count({ label, value, lang }: { label: string; value: number; lang: Language }) {
  return (
    <li className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{formatNumber(value, lang)}</p>
    </li>
  )
}

function ReportCard({
  report,
  copy,
  lang,
}: {
  report: QueueReport & { entities: LinkedEntity[] }
  copy: Messages
  lang: Language
}) {
  return (
    <Link
      href={`/admin/reports/${report.id}`}
      className="block rounded-2xl border border-line bg-card px-5 py-4 hover:border-pine"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${statusClass(report.status)}`}>
          {copy.myReports.status[report.status]}
        </span>
        <time dateTime={report.created_at} className="text-sm text-muted">
          {copy.admin.filed} {formatWhen(report.created_at, lang, 'Asia/Dhaka')}
        </time>
      </div>
      <p className="mt-3 line-clamp-3">{report.description}</p>
      {report.entities.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {report.entities.map((entity) => (
            <li key={entity.entityId} className="break-all">
              <span className="text-muted">{copy.myReports.kinds[entity.kind]}</span> {entity.value}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-3 text-sm text-muted">
        {copy.myReports.happened} {formatWhen(report.occurred_on, lang, 'UTC')}
        {report.amount_lost !== null && report.amount_lost !== ''
          ? ` · ${copy.myReports.lost} ${formatTaka(report.amount_lost, lang)}`
          : ''}
      </p>
      {report.admin_notes ? (
        <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm">
          <span className="font-medium">{copy.myReports.notes}: </span>
          {report.admin_notes}
        </p>
      ) : null}
      <p className="mt-3 text-sm font-medium text-pine">{copy.admin.open}</p>
    </Link>
  )
}

function statusClass(status: ReportStatus): string {
  if (status === 'approved') return 'bg-pine/10 text-pine-dark'
  if (status === 'rejected') return 'bg-ink/5 text-muted'
  return 'bg-clay/10 text-clay'
}

async function loadQueue(): Promise<{
  queue: (QueueReport & { entities: LinkedEntity[] })[]
  approved: (QueueReport & { entities: LinkedEntity[] })[]
  pending: number
  needsInfo: number
} | null> {
  try {
    const supabase = await createClient()
    const [queueResult, approvedResult] = await Promise.all([
      supabase.rpc('admin_review_queue'),
      supabase
        .from('reports')
        .select('id, description, amount_lost, status, occurred_on, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
    ])

    if (queueResult.error) {
      if (queueResult.error.message.toLowerCase().includes('admin only')) forbidden()
      console.error(queueResult.error.message)
      return null
    }
    if (approvedResult.error || !Array.isArray(queueResult.data) || !Array.isArray(approvedResult.data)) {
      if (approvedResult.error) console.error(approvedResult.error.message)
      return null
    }

    const queue = queueResult.data
      .map(asQueueReport)
      .filter((report): report is QueueReport => report !== null)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
    const approved = approvedResult.data
      .map(asQueueReport)
      .filter((report): report is QueueReport => report !== null)

    const entities = await linkedEntities([...queue, ...approved].map((report) => report.id))
    if (entities === null) return null

    const withEntities = (report: QueueReport) => ({
      ...report,
      entities: entities.filter((entity) => entity.reportId === report.id),
    })

    return {
      queue: queue.map(withEntities),
      approved: approved.map(withEntities),
      pending: queue.filter((report) => report.status === 'pending').length,
      needsInfo: queue.filter((report) => report.status === 'needs_info').length,
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error(error)
    return null
  }
}

function asQueueReport(value: unknown): QueueReport | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<QueueReport>
  if (typeof row.id !== 'string' || typeof row.description !== 'string') return null
  if (typeof row.created_at !== 'string' || typeof row.occurred_on !== 'string') return null
  if (!isStatus(row.status)) return null
  return {
    id: row.id,
    description: row.description,
    amount_lost: row.amount_lost ?? null,
    status: row.status,
    occurred_on: row.occurred_on,
    admin_notes: typeof row.admin_notes === 'string' ? row.admin_notes : null,
    created_at: row.created_at,
  }
}

function isStatus(value: unknown): value is ReportStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'needs_info'
}
