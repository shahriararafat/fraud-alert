import { headers } from 'next/headers'

export const AUTH_NEXT_COOKIE = 'auth_next'

export async function appOrigin(): Promise<string> {
  const headerStore = await headers()
  return originFromHeaders(headerStore)
}

export function originFromHeaders(headerStore: {
  get(name: string): string | null
}): string {
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') ?? 'http'
  if (!host) return 'http://127.0.0.1:3000'
  return `${proto}://${host}`
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  if (value.includes('\\') || value.includes('\n') || value.includes('\r')) return '/'
  return value
}
