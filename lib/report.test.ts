import { describe, expect, it } from 'vitest'
import {
  dhakaToday,
  imageKind,
  normalizeLink,
  parseReport,
  type ReportFormInput,
} from './report'

const today = '2026-11-12'

function input(overrides: Partial<ReportFormInput> = {}): ReportFormInput {
  return {
    phones: '01712345678',
    shopName: '',
    website: '',
    social: '',
    description: 'I sent bKash money and the seller blocked me.',
    amount: '',
    occurredOn: '2026-11-01',
    files: [{ type: 'image/png', size: 1200 }],
    today,
    ...overrides,
  }
}

describe('parseReport', () => {
  it('normalizes phones and keeps one entity when the same number is repeated', () => {
    const parsed = parseReport(
      input({ phones: '+8801712345678\n01712-345678, ০১৮১২৩৪৫৬৭৮' }),
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.entities).toEqual([
      { kind: 'phone', value: '01712345678' },
      { kind: 'phone', value: '01812345678' },
    ])
  })

  it('accepts a shop name when there is no phone', () => {
    const parsed = parseReport(input({ phones: '', shopName: '  Rahim   Electronics  ' }))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.entities).toEqual([{ kind: 'shop_name', value: 'Rahim Electronics' }])
  })

  it('requires at least one identifier', () => {
    expect(parseReport(input({ phones: '' })).ok).toBe(false)
    expect(parseReport(input({ phones: '   ' }))).toEqual({ ok: false, error: 'identifier' })
  })

  it('rejects a number that is not a Bangladeshi mobile', () => {
    expect(parseReport(input({ phones: '02123456789' }))).toEqual({ ok: false, error: 'phone' })
  })

  it('rejects a bad website and accepts a bare domain', () => {
    expect(parseReport(input({ phones: '', website: 'javascript:alert(1)' }))).toEqual({
      ok: false,
      error: 'website',
    })
    const parsed = parseReport(input({ phones: '', website: 'Shop.Example.com/deal/' }))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.entities).toEqual([
      { kind: 'url', value: 'https://shop.example.com/deal' },
    ])
  })

  it('normalizes social links and rejects a link that is not http', () => {
    const parsed = parseReport(
      input({ phones: '', social: 'facebook.com/scam-page\nhttps://instagram.com/scam/' }),
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.entities).toEqual([
      { kind: 'social', value: 'https://facebook.com/scam-page' },
      { kind: 'social', value: 'https://instagram.com/scam' },
    ])
    expect(parseReport(input({ phones: '', social: 'not a link' }))).toEqual({
      ok: false,
      error: 'social',
    })
  })

  it('checks the story, the amount, and the date', () => {
    expect(parseReport(input({ description: 'too short' }))).toEqual({
      ok: false,
      error: 'description',
    })
    expect(parseReport(input({ amount: '-5' }))).toEqual({ ok: false, error: 'amount' })
    expect(parseReport(input({ amount: '10.999' }))).toEqual({ ok: false, error: 'amount' })
    const withAmount = parseReport(input({ amount: '১,৫০০.৫০' }))
    expect(withAmount.ok).toBe(true)
    if (!withAmount.ok) return
    expect(withAmount.value.amountLost).toBe('1500.50')
    expect(parseReport(input({ occurredOn: '2026-11-13' }))).toEqual({ ok: false, error: 'date' })
    expect(parseReport(input({ occurredOn: '2026-02-31' }))).toEqual({ ok: false, error: 'date' })
    expect(parseReport(input({ occurredOn: '2009-12-31' }))).toEqual({ ok: false, error: 'date' })
  })

  it('limits screenshot type, size, and count', () => {
    expect(parseReport(input({ files: [] }))).toEqual({ ok: false, error: 'file_required' })
    expect(parseReport(input({ files: [{ type: 'application/pdf', size: 100 }] }))).toEqual({
      ok: false,
      error: 'file_type',
    })
    expect(parseReport(input({ files: [{ type: 'image/png', size: 5 * 1024 * 1024 + 1 }] }))).toEqual({
      ok: false,
      error: 'file_size',
    })
    expect(
      parseReport(
        input({
          files: [
            { type: 'image/png', size: 10 },
            { type: 'image/jpeg', size: 10 },
            { type: 'image/webp', size: 10 },
            { type: 'image/png', size: 10 },
          ],
        }),
      ),
    ).toEqual({ ok: false, error: 'file_count' })
  })
})

describe('normalizeLink', () => {
  it('drops a trailing slash on the bare host', () => {
    expect(normalizeLink('https://example.com/')).toBe('https://example.com')
  })

  it('rejects localhost and credentials', () => {
    expect(normalizeLink('http://localhost/shop')).toBeNull()
    expect(normalizeLink('https://user:pass@example.com/a')).toBeNull()
  })
})

describe('imageKind', () => {
  it('recognizes png, jpeg, and webp headers', () => {
    expect(
      imageKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('png')
    expect(imageKind(new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe('jpeg')
    const webp = new Uint8Array(12)
    webp.set([0x52, 0x49, 0x46, 0x46], 0)
    webp.set([0x57, 0x45, 0x42, 0x50], 8)
    expect(imageKind(webp)).toBe('webp')
    expect(imageKind(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))).toBeNull()
  })
})

describe('dhakaToday', () => {
  it('uses the Asia/Dhaka calendar day', () => {
    expect(dhakaToday(new Date('2026-11-11T20:00:00Z'))).toBe('2026-11-12')
    expect(dhakaToday(new Date('2026-11-11T17:00:00Z'))).toBe('2026-11-11')
  })
})
