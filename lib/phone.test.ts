import { describe, expect, it } from 'vitest'
import { normalizeBdPhone } from './phone'

describe('normalizeBdPhone', () => {
  it('treats local, 880, and +880 as the same number', () => {
    const local = normalizeBdPhone('01712345678')
    expect(local).toBe('01712345678')
    expect(normalizeBdPhone('+8801712345678')).toBe(local)
    expect(normalizeBdPhone('8801712345678')).toBe(local)
    expect(normalizeBdPhone('008801712345678')).toBe(local)
  })

  it('ignores spaces, dashes, and an extra 0 after 880', () => {
    expect(normalizeBdPhone('01712-345 678')).toBe('01712345678')
    expect(normalizeBdPhone('+880 1712-345678')).toBe('01712345678')
    expect(normalizeBdPhone('+880 01712345678')).toBe('01712345678')
  })

  it('accepts Bangla digits', () => {
    expect(normalizeBdPhone('০১৭১২৩৪৫৬৭৮')).toBe('01712345678')
    expect(normalizeBdPhone('+৮৮০১৮১২৩৪৫৬৭৮')).toBe('01812345678')
  })

  it('accepts every current mobile prefix', () => {
    for (const prefix of ['013', '014', '015', '016', '017', '018', '019']) {
      expect(normalizeBdPhone(`${prefix}12345678`)).toBe(`${prefix}12345678`)
    }
  })

  it('rejects numbers that are not Bangladeshi mobiles', () => {
    expect(normalizeBdPhone('01112345678')).toBeNull()
    expect(normalizeBdPhone('01212345678')).toBeNull()
    expect(normalizeBdPhone('0171234567')).toBeNull()
    expect(normalizeBdPhone('017123456789')).toBeNull()
    expect(normalizeBdPhone('+880171234567')).toBeNull()
    expect(normalizeBdPhone('')).toBeNull()
    expect(normalizeBdPhone('not a phone')).toBeNull()
  })
})
