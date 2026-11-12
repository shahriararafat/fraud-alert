import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { originFromHeaders } from '@/lib/origin'
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
  const next = safePath(searchParams.get('next'))

  if (tokenHash && isOtpType(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/login?error=link`)
}

function isOtpType(value: string | null): value is EmailOtpType {
  return OTP_TYPES.some((type) => type === value)
}

function safePath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}
