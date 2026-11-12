import { messages } from './messages'
import { createClient } from './supabase/server'

export type EntityKind = keyof (typeof messages)['en']['myReports']['kinds']

export type LinkedEntity = {
  reportId: string
  entityId: string
  kind: EntityKind
  value: string
}

export async function linkedEntities(reportIds: string[]): Promise<LinkedEntity[] | null> {
  if (reportIds.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('report_entities')
    .select('report_id, entity_id, scam_entities(kind, value)')
    .in('report_id', reportIds)
  if (error || !Array.isArray(data)) return null

  const links: LinkedEntity[] = []
  for (const row of data) {
    const reportId = row?.report_id
    const entityId = row?.entity_id
    const entity = Array.isArray(row?.scam_entities) ? row.scam_entities[0] : row?.scam_entities
    if (typeof reportId !== 'string' || typeof entityId !== 'string') continue
    if (!entity?.kind || !entity?.value) continue
    if (!(entity.kind in messages.en.myReports.kinds)) continue
    links.push({ reportId, entityId, kind: entity.kind, value: entity.value })
  }

  links.sort((a, b) => a.kind.localeCompare(b.kind) || a.value.localeCompare(b.value))
  return links
}
