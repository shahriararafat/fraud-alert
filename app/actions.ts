'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  imageContentType,
  imageKind,
  dhakaToday,
  parseReport,
  REPORTS_PER_DAY,
} from '@/lib/report'
import { AUTH_NEXT_COOKIE, appOrigin, safeNextPath } from '@/lib/origin'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(String(formData.get('next') ?? ''))
  await rememberNext(next)

  const supabase = await createClient()
  const origin = await appOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) redirect(loginPath('google', next))
  redirect(data.url)
}

export async function sendMagicLink(formData: FormData) {
  const next = safeNextPath(String(formData.get('next') ?? ''))
  const email = String(formData.get('email') ?? '').trim()
  if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    redirect(loginPath('email', next))
  }

  await rememberNext(next)
  const supabase = await createClient()
  const origin = await appOrigin()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  })

  if (error) redirect(loginPath('send', next))
  redirect(loginPath('sent', next))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function submitReport(formData: FormData) {
  const supabase = await createClient()
  const { data, error: authError } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (authError || !userId) redirect('/login?next=/report')

  const files = formData
    .getAll('evidence')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  const parsed = parseReport({
    phones: String(formData.get('phones') ?? ''),
    shopName: String(formData.get('shop_name') ?? ''),
    website: String(formData.get('website') ?? ''),
    social: String(formData.get('social') ?? ''),
    description: String(formData.get('description') ?? ''),
    amount: String(formData.get('amount') ?? ''),
    occurredOn: String(formData.get('occurred_on') ?? ''),
    files: files.map((file) => ({ type: file.type, size: file.size })),
    today: dhakaToday(),
  })
  if (!parsed.ok) redirect(`/report?error=${parsed.error}`)

  const { data: existing } = await supabase.rpc('my_reports')
  if (Array.isArray(existing)) {
    const today = dhakaToday()
    const filedToday = existing.filter((row: { created_at?: string }) => {
      if (!row?.created_at) return false
      return dhakaToday(new Date(row.created_at)) === today
    }).length
    if (filedToday >= REPORTS_PER_DAY) redirect('/report?error=rate')
  }

  const uploads: { bytes: Uint8Array; contentType: string; ext: string }[] = []
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const kind = imageKind(bytes)
    if (!kind) redirect('/report?error=file_type')
    uploads.push({ bytes, contentType: imageContentType(kind), ext: kind === 'jpeg' ? 'jpg' : kind })
  }

  const paths: string[] = []
  for (const upload of uploads) {
    const path = `${userId}/${crypto.randomUUID()}.${upload.ext}`
    const { error } = await supabase.storage.from('evidence').upload(path, upload.bytes, {
      contentType: upload.contentType,
      upsert: false,
    })
    if (error) {
      await removeEvidence(supabase, paths)
      console.error(error.message)
      redirect('/report?error=save')
    }
    paths.push(path)
  }

  const { error } = await supabase.rpc('submit_report', {
    report_description: parsed.value.description,
    report_amount: parsed.value.amountLost,
    report_date: parsed.value.occurredOn,
    entities: parsed.value.entities,
    evidence_paths: paths,
  })
  if (error) {
    await removeEvidence(supabase, paths)
    console.error(error.message)
    if (error.message.toLowerCase().includes('report limit reached')) {
      redirect('/report?error=rate')
    }
    redirect('/report?error=save')
  }

  redirect('/reports?submitted=1')
}

async function rememberNext(next: string) {
  const store = await cookies()
  if (next === '/') {
    store.delete(AUTH_NEXT_COOKIE)
    return
  }
  store.set(AUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  })
}

function loginPath(kind: 'google' | 'email' | 'send' | 'sent', next: string): string {
  if (kind === 'sent') {
    return next === '/' ? '/login?sent=1' : `/login?sent=1&next=${encodeURIComponent(next)}`
  }
  const params = new URLSearchParams({ error: kind })
  if (next !== '/') params.set('next', next)
  return `/login?${params}`
}

async function removeEvidence(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  if (paths.length === 0) return
  await supabase.storage.from('evidence').remove(paths)
}
