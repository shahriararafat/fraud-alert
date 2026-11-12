import Link from 'next/link'
import { signOut } from '@/app/actions'
import type { Language } from '@/lib/language'
import type { Messages } from '@/lib/messages'
import { LanguageToggle } from './language-toggle'

export function Header({
  copy,
  lang,
  email,
  isAdmin,
}: {
  copy: Messages
  lang: Language
  email: string | null
  isAdmin: boolean
}) {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-pine">
          <Shield />
          {copy.brand}
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link
            href={email ? '/report' : '/login?next=/report'}
            className="hover:text-pine"
          >
            {copy.nav.report}
          </Link>
          {email ? (
            <Link href="/reports" className="hover:text-pine">
              {copy.nav.myReports}
            </Link>
          ) : null}
          {isAdmin ? (
            <Link href="/admin" className="hover:text-pine">
              {copy.nav.admin}
            </Link>
          ) : null}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <LanguageToggle
            lang={lang}
            label={copy.language.label}
            english={copy.language.en}
            bangla={copy.language.bn}
          />
          {email ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <p className="text-muted">
                {copy.signedIn}{' '}
                <span className="font-medium text-ink">{email}</span>
              </p>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-line px-3 py-1.5 hover:bg-paper"
                >
                  {copy.signOut}
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-pine px-3 py-1.5 text-sm font-medium text-white hover:bg-pine-dark"
            >
              {copy.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2 4 5v6c0 5 3.4 8.4 8 9.5 4.6-1.1 8-4.5 8-9.5V5l-8-3Z"
      />
    </svg>
  )
}
