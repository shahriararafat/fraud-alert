import { headers } from 'next/headers'

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
