import { cookies } from 'next/headers'

export const languages = ['en', 'bn'] as const
export type Language = (typeof languages)[number]

export async function getLanguage(): Promise<Language> {
  const store = await cookies()
  return store.get('lang')?.value === 'bn' ? 'bn' : 'en'
}
