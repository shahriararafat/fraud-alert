import Link from 'next/link'
import { getLanguage } from '@/lib/language'
import { messages } from '@/lib/messages'

export default async function Forbidden() {
  const copy = messages[await getLanguage()].admin

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-16">
      <p className="text-sm font-semibold text-clay">403</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{copy.forbiddenTitle}</h1>
      <p className="mt-3 text-muted">{copy.forbiddenBody}</p>
      <Link href="/" className="mt-6 font-medium text-pine hover:text-pine-dark">
        {copy.home}
      </Link>
    </main>
  )
}
