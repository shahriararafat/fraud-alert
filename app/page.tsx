import { SearchBox } from '@/components/search-box'
import { getLanguage } from '@/lib/language'
import { messages } from '@/lib/messages'

export default async function HomePage() {
  const copy = messages[await getLanguage()].home

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:py-16">
      <p className="text-sm font-semibold tracking-wide text-clay">{copy.kicker}</p>
      <h1 className="mt-2 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{copy.lede}</p>
      <SearchBox
        label={copy.searchLabel}
        placeholder={copy.searchPlaceholder}
        button={copy.searchButton}
      />
      <section className="mt-14 max-w-3xl">
        <h2 className="text-xl font-semibold">{copy.stepsTitle}</h2>
        <ol className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
          {copy.steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 px-5 py-4">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-sm font-semibold text-pine">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
