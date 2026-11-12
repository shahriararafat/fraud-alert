import { forbidden, redirect } from 'next/navigation'
import { safeNextPath } from './origin'
import { createClient } from './supabase/server'
import { supabaseEnv } from './supabase/env'

export type CurrentProfile = {
  id: string
  email: string
  role: 'user' | 'admin'
}

export async function currentUserEmail(): Promise<string | null> {
  if (!supabaseEnv()) return null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data) return null
    return data.claims.email ?? null
  } catch {
    return null
  }
}

export async function currentProfile(): Promise<CurrentProfile | null> {
  if (!supabaseEnv()) return null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getClaims()
    const id = data?.claims.sub
    const email = data?.claims.email
    if (error || !id || !email) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .maybeSingle()

    return { id, email, role: profile?.role === 'admin' ? 'admin' : 'user' }
  } catch {
    return null
  }
}

export async function requireAdmin(nextPath: string): Promise<CurrentProfile> {
  const profile = await currentProfile()
  const next = safeNextPath(nextPath)
  if (!profile) redirect(next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`)
  if (profile.role !== 'admin') forbidden()
  return profile
}
