import { describe, expect, it } from 'vitest'
import { SEVERITY_THRESHOLDS, severityForApprovedCount } from './severity'

describe('severityForApprovedCount', () => {
  it('uses the shared thresholds', () => {
    expect(SEVERITY_THRESHOLDS).toEqual({
      low: 1,
      medium: 3,
      high: 5,
      critical: 9,
    })
  })

  it('maps approved-report counts onto the four bands', () => {
    expect(severityForApprovedCount(0)).toBe('none')
    expect(severityForApprovedCount(1)).toBe('low')
    expect(severityForApprovedCount(2)).toBe('low')
    expect(severityForApprovedCount(3)).toBe('medium')
    expect(severityForApprovedCount(4)).toBe('medium')
    expect(severityForApprovedCount(5)).toBe('high')
    expect(severityForApprovedCount(8)).toBe('high')
    expect(severityForApprovedCount(9)).toBe('critical')
    expect(severityForApprovedCount(20)).toBe('critical')
  })
})
