import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { submitReport } from '@/app/actions'
import { currentUserEmail } from '@/lib/auth'
import { dhakaToday } from '@/lib/report'
import { getLanguage } from '@/lib/language'
import { messages, type Messages } from '@/lib/messages'

const fieldClass = 'rounded-xl border border-line bg-card px-4 py-3 outline-none'

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (!(await currentUserEmail())) redirect('/login?next=/report')

  const params = await searchParams
  const copy = messages[await getLanguage()].report
  const error = reportError(params.error, copy.errors)

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-2 text-muted">{copy.lede}</p>
      <p className="mt-2 text-sm text-muted">{copy.identifierHint}</p>

      {error ? (
        <p role="alert" className="mt-6 rounded-xl border border-clay/30 bg-clay/10 px-4 py-3 text-sm text-clay">
          {error}
        </p>
      ) : null}

      <form action={submitReport} className="mt-8 flex flex-col gap-5">
        <Field id="phones" label={copy.phonesLabel} hint={copy.phonesHint}>
          <textarea id="phones" name="phones" rows={3} aria-describedby="phones-hint" aria-invalid={invalid(params.error, 'phone', 'identifier')} className={fieldClass} />
        </Field>
        <Field id="shop_name" label={copy.shopLabel} hint={copy.shopHint}>
          <input id="shop_name" name="shop_name" type="text" maxLength={120} aria-describedby="shop_name-hint" aria-invalid={invalid(params.error, 'shop')} className={`${fieldClass} h-12`} />
        </Field>
        <Field id="website" label={copy.websiteLabel} hint={copy.websiteHint}>
          <input id="website" name="website" type="text" inputMode="url" aria-describedby="website-hint" aria-invalid={invalid(params.error, 'website')} className={`${fieldClass} h-12`} />
        </Field>
        <Field id="social" label={copy.socialLabel} hint={copy.socialHint}>
          <textarea id="social" name="social" rows={3} aria-describedby="social-hint" aria-invalid={invalid(params.error, 'social')} className={fieldClass} />
        </Field>
        <Field id="description" label={copy.descriptionLabel} hint={copy.descriptionHint}>
          <textarea id="description" name="description" rows={5} aria-describedby="description-hint" aria-invalid={invalid(params.error, 'description')} className={fieldClass} />
        </Field>
        <Field id="amount" label={copy.amountLabel} hint={copy.amountHint}>
          <input id="amount" name="amount" type="text" inputMode="decimal" aria-describedby="amount-hint" aria-invalid={invalid(params.error, 'amount')} className={`${fieldClass} h-12`} />
        </Field>
        <Field id="occurred_on" label={copy.dateLabel} hint={copy.dateHint}>
          <input
            id="occurred_on"
            name="occurred_on"
            type="date"
            max={dhakaToday()}
            aria-describedby="occurred_on-hint"
            aria-invalid={invalid(params.error, 'date')}
            className={`${fieldClass} h-12`}
          />
        </Field>
        <Field id="evidence" label={copy.evidenceLabel} hint={copy.evidenceHint}>
          <input
            id="evidence"
            name="evidence"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            aria-describedby="evidence-hint"
            aria-invalid={invalid(params.error, 'file_type', 'file_size', 'file_count', 'file_required')}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </Field>
        <button
          type="submit"
          className="h-12 rounded-xl bg-pine text-base font-medium text-white hover:bg-pine-dark"
        >
          {copy.submit}
        </button>
      </form>
    </main>
  )
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint: string
  children: ReactNode
}) {
  const hintId = `${id}-hint`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      <p id={hintId} className="text-sm text-muted">
        {hint}
      </p>
    </div>
  )
}

function invalid(code: string | undefined, ...codes: string[]): boolean {
  return Boolean(code && codes.includes(code))
}

function reportError(
  code: string | undefined,
  errors: Messages['report']['errors'],
): string | null {
  if (!code) return null
  if (Object.prototype.hasOwnProperty.call(errors, code)) {
    return errors[code as keyof typeof errors]
  }
  return errors.save
}
