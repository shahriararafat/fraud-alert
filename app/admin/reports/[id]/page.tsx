import Link from 'next/link'
import { forbidden } from 'next/navigation'
import { reviewReport } from '@/app/actions'
import { requireAdmin } from '@/lib/auth'
import { linkedEntities, type LinkedEntity } from '@/lib/entities'
import { formatNumber, formatTaka, formatWhen } from '@/lib/format'
import type { Language } from '@/lib/language'
import { getLanguage } from '@/lib/language'
import { messages, type Messages } from '@/lib/messages'
import { severityForApprovedCount } from '@/lib/severity'
import { createClient } from '@/lib/supabase/server'

const EVIDENCE_URL_SECONDS = 180

type ReportStatus = keyof Messages['myReports']['status']
type DetailCopy = Messages['admin']['detail']

type AdminReport = {
  id: string
  reporter_id: string
  description: string
  amount_lost: number | string | null
  status: ReportStatus
  occurred_on: string
  admin_notes: string | null
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  other_report_count: number
}

type Shot = { id: string; url: string | null }

export default async function AdminReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { id } = await params
  const nextPath = isUuid(id) ? `/admin/reports/${id}` : '/admin'
  await requireAdmin(nextPath)

  const query = await searchParams
  const lang = await getLanguage()
  const copy = messages[lang]
  const detail = copy.admin.detail
  const report = isUuid(id) ? await loadReport(id) : 'missing'

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12">
      <Link href="/admin" className="text-sm font-medium text-pine hover:text-pine-dark">
        {copy.admin.back}
      </Link>

      {report === 'missing' ? (
        <p className="mt-6 text-muted">{detail.missing}</p>
      ) : report === null ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {detail.loadError}
        </p>
      ) : (
        <ReportView report={report} copy={copy} detail={detail} lang={lang} query={query} />
      )}
    </main>
  )
}

function ReportView({
  report,
  copy,
  detail,
  lang,
  query,
}: {
  report: AdminReport & {
    entities: (LinkedEntity & { approvedCount: number })[]
    shots: Shot[]
    reporterName: string | null
    reviewerName: string | null
  }
  copy: Messages
  detail: DetailCopy
  lang: Language
  query: { saved?: string; error?: string }
}) {
  const error = reviewError(query.error, detail.errors)
  const awaiting = report.status === 'pending' || report.status === 'needs_info'

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.myReports.status[report.status]}</h1>
        <time dateTime={report.created_at} className="text-sm text-muted">
          {detail.filed} {formatWhen(report.created_at, lang, 'Asia/Dhaka')}
        </time>
      </div>
      <p className="mt-2 text-sm text-muted">{detail.effect[report.status]}</p>
      {report.reporterName ? (
        <p className="mt-2 text-sm">
          <span className="text-muted">{detail.filedBy}: </span>
          {report.reporterName}
        </p>
      ) : null}
      <p className="mt-1 text-sm">
        <span className="text-muted">{detail.otherReports}: </span>
        {formatNumber(report.other_report_count, lang)}
      </p>

      {query.saved === '1' && !error ? (
        <p className="mt-6 rounded-xl border border-pine/30 bg-pine/10 px-4 py-3 text-sm text-pine-dark">
          {detail.saved}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {error}
        </p>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold">{copy.report.descriptionLabel}</h2>
      <p className="mt-2 whitespace-pre-wrap">{report.description}</p>
      <p className="mt-3 text-sm text-muted">
        {detail.happened} {formatWhen(report.occurred_on, lang, 'UTC')}
        {report.amount_lost !== null && report.amount_lost !== ''
          ? ` · ${detail.lost} ${formatTaka(report.amount_lost, lang)}`
          : ''}
      </p>

      <h2 className="mt-8 text-lg font-semibold">{detail.identifiers}</h2>
      {report.entities.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{detail.noIdentifiers}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {report.entities.map((entity) => (
            <EntityRow key={entity.entityId} entity={entity} status={report.status} detail={detail} lang={lang} kind={copy.myReports.kinds[entity.kind]} />
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">{detail.evidence}</h2>
      <p className="mt-1 text-sm text-muted">{detail.evidenceHint}</p>
      {report.shots.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{detail.evidenceEmpty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {report.shots.map((shot, index) => (
            <li key={shot.id} className="overflow-hidden rounded-2xl border border-line bg-card">
              {shot.url ? (
                // Signed URLs expire in a few minutes, so they skip the image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shot.url}
                  alt={`${detail.evidenceAlt} ${index + 1}`}
                  className="max-h-96 w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <p className="px-4 py-6 text-sm text-clay">{detail.evidenceError}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {report.admin_notes ? (
        <p className="mt-8 rounded-xl bg-paper px-3 py-2 text-sm">
          <span className="font-medium">{detail.currentNote}: </span>
          {report.admin_notes}
        </p>
      ) : null}
      {report.reviewed_at ? (
        <p className="mt-3 text-sm text-muted">
          {detail.reviewed} {formatWhen(report.reviewed_at, lang, 'Asia/Dhaka')}
          {report.reviewerName ? ` · ${report.reviewerName}` : ''}
        </p>
      ) : null}

      {awaiting || report.status === 'approved' ? (
        <form action={reviewReport} className="mt-8 flex flex-col gap-3">
          <input type="hidden" name="report_id" value={report.id} />
          <label htmlFor="note" className="text-sm font-medium">
            {detail.noteLabel}
          </label>
          <textarea
            id="note"
            name="note"
            rows={4}
            required
            maxLength={2000}
            className="rounded-xl border border-line bg-card px-4 py-3 outline-none"
          />
          <p className="text-sm text-muted">{awaiting ? detail.noteHint : detail.unpublishHint}</p>
          <div className="flex flex-wrap gap-3">
            {awaiting ? (
              <>
                <button type="submit" name="decision" value="approve" className="h-11 rounded-xl bg-pine px-4 font-medium text-white hover:bg-pine-dark">
                  {detail.approve}
                </button>
                <button type="submit" name="decision" value="needs_info" className="h-11 rounded-xl border border-line bg-card px-4 font-medium hover:bg-paper">
                  {detail.needsInfo}
                </button>
                <button type="submit" name="decision" value="reject" className="h-11 rounded-xl border border-clay px-4 font-medium text-clay hover:bg-clay/10">
                  {detail.reject}
                </button>
              </>
            ) : (
              <button type="submit" name="decision" value="unpublish" className="h-11 rounded-xl border border-clay px-4 font-medium text-clay hover:bg-clay/10">
                {detail.unpublish}
              </button>
            )}
          </div>
        </form>
      ) : null}
    </>
  )
}

function EntityRow({
  entity,
  status,
  detail,
  lang,
  kind,
}: {
  entity: LinkedEntity & { approvedCount: number }
  status: ReportStatus
  detail: DetailCopy
  lang: Language
  kind: string
}) {
  const now = severityForApprovedCount(entity.approvedCount)
  const ifApproved = severityForApprovedCount(status === 'approved' ? entity.approvedCount : entity.approvedCount + 1)
  const ifUnpublished = severityForApprovedCount(
    status === 'approved' ? Math.max(0, entity.approvedCount - 1) : entity.approvedCount,
  )

  return (
    <li className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="break-all">
        <span className="text-muted">{kind}</span> {entity.value}
      </p>
      <p className="mt-2 text-sm">
        {detail.approvedNow}: {formatNumber(entity.approvedCount, lang)} · {detail.severityNow}: {detail.severity[now]}
      </p>
      {status === 'pending' || status === 'needs_info' ? (
        <p className="mt-1 text-sm">
          {detail.severityIfApproved}: {formatNumber(entity.approvedCount + 1, lang)} · {detail.severity[ifApproved]}
        </p>
      ) : null}
      {status === 'approved' ? (
        <p className="mt-1 text-sm">
          {detail.severityIfUnpublished}: {formatNumber(Math.max(0, entity.approvedCount - 1), lang)} · {detail.severity[ifUnpublished]}
        </p>
      ) : null}
    </li>
  )
}

function reviewError(code: string | undefined, errors: DetailCopy['errors']): string | null {
  if (!code) return null
  if (Object.prototype.hasOwnProperty.call(errors, code)) return errors[code as keyof typeof errors]
  return errors.save
}

async function loadReport(id: string): Promise<
  | (AdminReport & {
      entities: (LinkedEntity & { approvedCount: number })[]
      shots: Shot[]
      reporterName: string | null
      reviewerName: string | null
    })
  | null
  | 'missing'
> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_report_detail', { target: id })
  if (error) {
    if (error.message.toLowerCase().includes('admin only')) forbidden()
    console.error(error.message)
    return null
  }
  const row = Array.isArray(data) ? asAdminReport(data[0]) : null
  if (!row) return 'missing'

  const [entities, evidence, names] = await Promise.all([
    linkedEntities([id]),
    loadEvidence(id),
    loadNames([row.reporter_id, row.reviewed_by]),
  ])
  if (entities === null || evidence === null || names === null) return null

  const counts = await approvedCounts(entities.map((entity) => entity.entityId))
  if (counts === null) return null

  return {
    ...row,
    entities: entities.map((entity) => ({ ...entity, approvedCount: counts.get(entity.entityId) ?? 0 })),
    shots: evidence,
    reporterName: names.get(row.reporter_id) ?? null,
    reviewerName: row.reviewed_by ? names.get(row.reviewed_by) ?? null : null,
  }
}

async function loadEvidence(reportId: string): Promise<Shot[] | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('evidence_files')
    .select('id, storage_path, created_at')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })
  if (error || !Array.isArray(data)) return null

  const files = data.flatMap((row) => {
    if (typeof row?.id !== 'string' || typeof row?.storage_path !== 'string') return []
    return [{ id: row.id, storage_path: row.storage_path }]
  })
  if (files.length === 0) return []

  const { data: signed, error: signError } = await supabase.storage
    .from('evidence')
    .createSignedUrls(
      files.map((file) => file.storage_path),
      EVIDENCE_URL_SECONDS,
    )
  if (signError || !signed) {
    console.error(signError?.message ?? 'signed url failed')
    return files.map((file) => ({ id: file.id, url: null }))
  }

  return files.map((file) => {
    const match = signed.find((item) => item.path === file.storage_path)
    return { id: file.id, url: match?.signedUrl ?? null }
  })
}

async function approvedCounts(entityIds: string[]): Promise<Map<string, number> | null> {
  if (entityIds.length === 0) return new Map()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entity_approved_counts')
    .select('entity_id, approved_report_count')
    .in('entity_id', entityIds)
  if (error || !Array.isArray(data)) return null

  const counts = new Map<string, number>()
  for (const row of data) {
    if (typeof row?.entity_id !== 'string') continue
    counts.set(row.entity_id, Number(row.approved_report_count) || 0)
  }
  return counts
}

async function loadNames(ids: (string | null)[]): Promise<Map<string, string> | null> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (unique.length === 0) return new Map()
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', unique)
  if (error || !Array.isArray(data)) return null

  const names = new Map<string, string>()
  for (const row of data) {
    if (typeof row?.id === 'string' && typeof row.display_name === 'string' && row.display_name) {
      names.set(row.id, row.display_name)
    }
  }
  return names
}

function asAdminReport(value: unknown): AdminReport | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<AdminReport>
  if (typeof row.id !== 'string' || typeof row.reporter_id !== 'string') return null
  if (typeof row.description !== 'string' || typeof row.occurred_on !== 'string') return null
  if (typeof row.created_at !== 'string' || !isStatus(row.status)) return null
  return {
    id: row.id,
    reporter_id: row.reporter_id,
    description: row.description,
    amount_lost: row.amount_lost ?? null,
    status: row.status,
    occurred_on: row.occurred_on,
    admin_notes: typeof row.admin_notes === 'string' ? row.admin_notes : null,
    created_at: row.created_at,
    reviewed_by: typeof row.reviewed_by === 'string' ? row.reviewed_by : null,
    reviewed_at: typeof row.reviewed_at === 'string' ? row.reviewed_at : null,
    other_report_count: Number(row.other_report_count) || 0,
  }
}

function isStatus(value: unknown): value is ReportStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected' || value === 'needs_info'
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}
