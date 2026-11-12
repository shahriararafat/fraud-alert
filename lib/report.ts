import { normalizeBdPhone } from './phone'

export const REPORTS_PER_DAY = 5
export const MAX_EVIDENCE_FILES = 3
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024
export const MIN_DESCRIPTION = 20
export const MAX_DESCRIPTION = 4000
export const MAX_PHONES = 5
export const MAX_SOCIAL_LINKS = 5

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'
const EARLIEST_DATE = '2010-01-01'

export type EntityKind = 'phone' | 'shop_name' | 'url' | 'social'

export type ReportEntity = {
  kind: EntityKind
  value: string
}

export type ReportErrorCode =
  | 'identifier'
  | 'phone'
  | 'shop'
  | 'website'
  | 'social'
  | 'description'
  | 'amount'
  | 'date'
  | 'file_type'
  | 'file_size'
  | 'file_count'
  | 'file_required'

export type ParsedReport = {
  entities: ReportEntity[]
  description: string
  amountLost: string | null
  occurredOn: string
}

export type ReportFormInput = {
  phones: string
  shopName: string
  website: string
  social: string
  description: string
  amount: string
  occurredOn: string
  files: { type: string; size: number }[]
  today: string
}

export function dhakaToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function imageKind(bytes: Uint8Array): 'jpeg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg'
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp'
  }
  return null
}

export function imageContentType(kind: 'jpeg' | 'png' | 'webp'): string {
  if (kind === 'jpeg') return 'image/jpeg'
  if (kind === 'png') return 'image/png'
  return 'image/webp'
}

export function parseReport(
  input: ReportFormInput,
): { ok: true; value: ParsedReport } | { ok: false; error: ReportErrorCode } {
  const phones = parsePhones(input.phones)
  if (typeof phones === 'string') return { ok: false, error: phones }

  const shop = parseShop(input.shopName)
  if (shop === 'shop') return { ok: false, error: 'shop' }

  const website = parseWebsite(input.website)
  if (website === 'website') return { ok: false, error: 'website' }

  const social = parseSocial(input.social)
  if (typeof social === 'string') return { ok: false, error: 'social' }

  const entities: ReportEntity[] = [
    ...phones.map((value) => ({ kind: 'phone' as const, value })),
    ...(shop ? [{ kind: 'shop_name' as const, value: shop }] : []),
    ...(website ? [{ kind: 'url' as const, value: website }] : []),
    ...social.map((value) => ({ kind: 'social' as const, value })),
  ]
  if (entities.length === 0) return { ok: false, error: 'identifier' }

  const description = input.description.trim()
  if (description.length < MIN_DESCRIPTION || description.length > MAX_DESCRIPTION) {
    return { ok: false, error: 'description' }
  }

  const amountLost = parseAmount(input.amount)
  if (amountLost === 'amount') return { ok: false, error: 'amount' }

  if (!isAllowedDate(input.occurredOn, input.today)) return { ok: false, error: 'date' }

  const fileError = parseFiles(input.files)
  if (fileError) return { ok: false, error: fileError }

  return {
    ok: true,
    value: { entities, description, amountLost, occurredOn: input.occurredOn },
  }
}

function parsePhones(value: string): string[] | 'phone' {
  const items = splitList(value, /[\n,;]+/)
  if (items.length > MAX_PHONES) return 'phone'
  const phones: string[] = []
  for (const item of items) {
    const phone = normalizeBdPhone(item)
    if (!phone) return 'phone'
    if (!phones.includes(phone)) phones.push(phone)
  }
  return phones
}

function parseShop(value: string): string | null | 'shop' {
  const shop = value.trim().replace(/\s+/g, ' ')
  if (!shop) return null
  if (shop.length < 2 || shop.length > 120) return 'shop'
  return shop
}

function parseWebsite(value: string): string | null | 'website' {
  const website = value.trim()
  if (!website) return null
  return normalizeLink(website) ?? 'website'
}

function parseSocial(value: string): string[] | 'social' {
  const items = splitList(value, /\n+/)
  if (items.length > MAX_SOCIAL_LINKS) return 'social'
  const links: string[] = []
  for (const item of items) {
    const link = normalizeLink(item)
    if (!link) return 'social'
    if (!links.includes(link)) links.push(link)
  }
  return links
}

function parseAmount(value: string): string | null | 'amount' {
  const trimmed = value.trim()
  if (!trimmed) return null

  let whole = ''
  let fraction = ''
  let dot = false
  for (const char of trimmed) {
    const bangla = BANGLA_DIGITS.indexOf(char)
    const digit = bangla !== -1 ? String(bangla) : char >= '0' && char <= '9' ? char : ''
    if (digit) {
      if (dot) fraction += digit
      else whole += digit
      continue
    }
    if (char === '.' && !dot) {
      dot = true
      continue
    }
    if (char === ',' || char === ' ') continue
    return 'amount'
  }

  if (!whole || fraction.length > 2) return 'amount'
  const normalized = fraction ? `${whole}.${fraction}` : whole
  const numeric = Number(normalized)
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 9_999_999_999.99) return 'amount'
  return normalized
}

function parseFiles(files: { type: string; size: number }[]): ReportErrorCode | null {
  if (files.length === 0) return 'file_required'
  if (files.length > MAX_EVIDENCE_FILES) return 'file_count'
  for (const file of files) {
    if (!isDeclaredImage(file.type)) return 'file_type'
    if (file.size <= 0 || file.size > MAX_EVIDENCE_BYTES) return 'file_size'
  }
  return null
}

function isDeclaredImage(type: string): boolean {
  return type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp'
}

function isAllowedDate(value: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  return real && value >= EARLIEST_DATE && value <= today
}

function splitList(value: string, separator: RegExp): string[] {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeLink(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || trimmed.length > 300) return null
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`
  if (!/^https?:\/\//i.test(withScheme)) return null

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null

  const host = url.hostname.toLowerCase()
  const parts = host.split('.')
  const ipv4 = parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  if (!ipv4 && !host.includes('.')) return null

  url.hash = ''
  url.hostname = host
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
  }
  const text = url.toString()
  if (url.pathname === '/' && !url.search) return text.replace(/\/$/, '')
  return text
}
