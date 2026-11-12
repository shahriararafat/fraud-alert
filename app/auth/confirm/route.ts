import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_NEXT_COOKIE, originFromHeaders, safeNextPath } from '@/lib/origin'
import { createClient } from '@/lib/supabase/server'

const OTP_TYPES: EmailOtpType[] = [
  'email',
  'magiclink',
  'signup',
  'invite',
  'recovery',
  'email_change',
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = originFromHeaders(request.headers)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = safeNextPath(searchParams.get('next') ?? request.cookies.get(AUTH_NEXT_COOKIE)?.value)

  if (tokenHash && isOtpType(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.set(AUTH_NEXT_COOKIE, '', { path: '/', maxAge: 0 })
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}

function isOtpType(value: string | null): value is EmailOtpType {
  return OTP_TYPES.some((type) => type === value)
}
