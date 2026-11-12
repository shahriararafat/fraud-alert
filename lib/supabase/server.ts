import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseEnv } from './env'

export async function createClient() {
  const env = supabaseEnv()
  if (!env) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot set cookies. proxy.ts refreshes the session.
        }
      },
    },
  })
}
