'use client'

import { useRouter } from 'next/navigation'
import type { Language } from '@/lib/language'

const ONE_YEAR = 60 * 60 * 24 * 365

export function LanguageToggle({
  lang,
  label,
  english,
  bangla,
}: {
  lang: Language
  label: string
  english: string
  bangla: string
}) {
  const router = useRouter()

  function choose(next: Language) {
    document.cookie = `lang=${next}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
    document.documentElement.lang = next
    router.refresh()
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-line bg-paper p-0.5 text-sm"
    >
      <button
        type="button"
        aria-pressed={lang === 'en'}
        onClick={() => choose('en')}
        className={buttonClass(lang === 'en')}
      >
        {english}
      </button>
      <button
        type="button"
        aria-pressed={lang === 'bn'}
        onClick={() => choose('bn')}
        className={buttonClass(lang === 'bn')}
      >
        {bangla}
      </button>
    </div>
  )
}

function buttonClass(active: boolean): string {
  return active
    ? 'rounded-full bg-ink px-3 py-1 text-card'
    : 'rounded-full px-3 py-1 text-muted hover:text-ink'
}
