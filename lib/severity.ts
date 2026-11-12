export const SEVERITY_THRESHOLDS = {
  low: 1,
  medium: 3,
  high: 5,
  critical: 9,
} as const

export type Severity = 'none' | 'low' | 'medium' | 'high' | 'critical'

export function severityForApprovedCount(count: number): Severity {
  if (count >= SEVERITY_THRESHOLDS.critical) return 'critical'
  if (count >= SEVERITY_THRESHOLDS.high) return 'high'
  if (count >= SEVERITY_THRESHOLDS.medium) return 'medium'
  if (count >= SEVERITY_THRESHOLDS.low) return 'low'
  return 'none'
}
