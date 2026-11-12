'use server'

import { redirect } from 'next/navigation'
import { appOrigin } from '@/lib/origin'
import { createClient } from '@/lib/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()
  const origin = await appOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) redirect('/login?error=google')
  redirect(data.url)
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
    redirect('/login?error=email')
  }

  const supabase = await createClient()
  const origin = await appOrigin()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  })

  if (error) redirect('/login?error=send')
  redirect('/login?sent=1')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
