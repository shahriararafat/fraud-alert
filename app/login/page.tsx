import { redirect } from 'next/navigation'
import { sendMagicLink, signInWithGoogle } from '@/app/actions'
import { currentUserEmail } from '@/lib/auth'
import { getLanguage } from '@/lib/language'
import { messages } from '@/lib/messages'
import { safeNextPath } from '@/lib/origin'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; next?: string }>
}) {
  const params = await searchParams
  const next = safeNextPath(params.next)
  const email = await currentUserEmail()
  if (email) redirect(next)
  const copy = messages[await getLanguage()].login
  const error =
    params.error === 'email'
      ? copy.errorEmail
      : params.error === 'send'
        ? copy.errorSend
        : params.error === 'google'
          ? copy.errorGoogle
          : params.error === 'link'
            ? copy.errorLink
            : null

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-2 text-muted">{copy.lede}</p>

      {params.sent === '1' ? (
        <p className="mt-6 rounded-xl border border-pine/30 bg-pine/10 px-4 py-3 text-sm text-pine-dark">
          {copy.sent}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {error}
        </p>
      ) : null}

      <form action={signInWithGoogle} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="h-12 w-full rounded-xl border border-line bg-card text-base font-medium hover:bg-paper"
        >
          {copy.google}
        </button>
      </form>

      <p className="my-4 text-center text-sm text-muted">{copy.or}</p>

      <form action={sendMagicLink} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email" className="text-sm font-medium">
          {copy.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={copy.emailPlaceholder}
          className="h-12 rounded-xl border border-line bg-card px-4 outline-none"
        />
        <button
          type="submit"
          className="h-12 rounded-xl bg-pine text-base font-medium text-white hover:bg-pine-dark"
        >
          {copy.send}
        </button>
      </form>
    </main>
  )
}
