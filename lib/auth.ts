import { createClient } from './supabase/server'
import { supabaseEnv } from './supabase/env'

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
