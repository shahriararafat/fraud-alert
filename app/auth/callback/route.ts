import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_NEXT_COOKIE, originFromHeaders, safeNextPath } from '@/lib/origin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = originFromHeaders(request.headers)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next') ?? request.cookies.get(AUTH_NEXT_COOKIE)?.value)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return finish(origin, next)
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}

function finish(origin: string, next: string) {
  const response = NextResponse.redirect(`${origin}${next}`)
  response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
