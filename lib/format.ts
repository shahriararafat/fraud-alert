import type { Language } from './language'

export function formatWhen(value: string, lang: Language, timeZone: 'Asia/Dhaka' | 'UTC'): string {
  const date = timeZone === 'UTC' ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : new Date(value)
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    dateStyle: 'medium',
    timeZone,
  }).format(date)
}

export function formatTaka(value: number | string, lang: Language): string {
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export function formatNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'bn' ? 'bn-BD' : 'en').format(value)
}
