import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUserEmail } from '@/lib/auth'
import type { Language } from '@/lib/language'
import { getLanguage } from '@/lib/language'
import { messages, type Messages } from '@/lib/messages'
import { createClient } from '@/lib/supabase/server'

type ReportStatus = keyof Messages['myReports']['status']
type EntityKind = keyof Messages['myReports']['kinds']

type MyReport = {
  id: string
  description: string
  amount_lost: number | string | null
  status: ReportStatus
  occurred_on: string
  admin_notes: string | null
  created_at: string
}

type LinkedEntity = {
  report_id: string
  kind: EntityKind
  value: string
}

export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  if (!(await currentUserEmail())) redirect('/login?next=/reports')

  const params = await searchParams
  const lang = await getLanguage()
  const copy = messages[lang].myReports
  const loaded = await loadReports()

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-2 text-muted">{copy.lede}</p>

      {params.submitted === '1' ? (
        <p className="mt-6 rounded-xl border border-pine/30 bg-pine/10 px-4 py-3 text-sm text-pine-dark">
          {copy.submitted}
        </p>
      ) : null}

      {loaded === null ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {copy.loadError}
        </p>
      ) : loaded.length === 0 ? (
        <p className="mt-8 text-muted">
          {copy.empty}{' '}
          <Link href="/report" className="font-medium text-pine hover:text-pine-dark">
            {copy.emptyLink}
          </Link>
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {loaded.map((report) => (
            <li key={report.id} className="rounded-2xl border border-line bg-card px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${statusClass(report.status)}`}>
                  {copy.status[report.status]}
                </span>
                <time dateTime={report.created_at} className="text-sm text-muted">
                  {copy.filed} {formatWhen(report.created_at, lang, 'Asia/Dhaka')}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap">{report.description}</p>
              {report.entities.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {report.entities.map((entity) => (
                    <li key={`${entity.kind}:${entity.value}`}>
                      <span className="text-muted">{copy.kinds[entity.kind]}</span> {entity.value}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-sm text-muted">
                {copy.happened} {formatWhen(report.occurred_on, lang, 'UTC')}
                {report.amount_lost !== null && report.amount_lost !== ''
                  ? ` · ${copy.lost} ${formatTaka(report.amount_lost, lang)}`
                  : ''}
              </p>
              {report.admin_notes ? (
                <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-sm">
                  <span className="font-medium">{copy.notes}: </span>
                  {report.admin_notes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

async function loadReports(): Promise<(MyReport & { entities: LinkedEntity[] })[] | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('my_reports')
    if (error || !Array.isArray(data)) return null

    const reports = (data as MyReport[])
      .filter((report) => report && typeof report.id === 'string')
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

    const entities = await loadEntities(
      supabase,
      reports.map((report) => report.id),
    )
    if (entities === null) return null

    return reports.map((report) => ({
      ...report,
      status: report.status in messages.en.myReports.status ? report.status : 'pending',
      entities: entities.filter((entity) => entity.report_id === report.id),
    }))
  } catch {
    return null
  }
}

async function loadEntities(
  supabase: Awaited<ReturnType<typeof createClient>>,
  reportIds: string[],
): Promise<LinkedEntity[] | null> {
  if (reportIds.length === 0) return []
  const { data, error } = await supabase
    .from('report_entities')
    .select('report_id, scam_entities(kind, value)')
    .in('report_id', reportIds)
  if (error || !Array.isArray(data)) return null

  const links: LinkedEntity[] = []
  for (const row of data) {
    const reportId = row?.report_id
    const entity = Array.isArray(row?.scam_entities) ? row.scam_entities[0] : row?.scam_entities
    if (typeof reportId !== 'string' || !entity?.kind || !entity?.value) continue
    if (!(entity.kind in messages.en.myReports.kinds)) continue
    links.push({ report_id: reportId, kind: entity.kind, value: entity.value })
  }
  return links
}

function statusClass(status: ReportStatus): string {
  if (status === 'approved') return 'bg-pine/10 text-pine-dark'
  if (status === 'rejected') return 'bg-ink/5 text-muted'
  return 'bg-clay/10 text-clay'
}

function formatWhen(value: string, lang: Language, timeZone: string): string {
  const date = timeZone === 'UTC' ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : new Date(value)
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    dateStyle: 'medium',
    timeZone,
  }).format(date)
}

function formatTaka(value: number | string, lang: Language): string {
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
  }).format(Number(value))
}
