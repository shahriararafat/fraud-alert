import type { Metadata } from 'next'
import { Noto_Sans, Noto_Sans_Bengali } from 'next/font/google'
import { Header } from '@/components/header'
import { currentProfile } from '@/lib/auth'
import { getLanguage } from '@/lib/language'
import { messages } from '@/lib/messages'
import './globals.css'

const noto = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto',
})

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-bn',
})

export async function generateMetadata(): Promise<Metadata> {
  const copy = messages[await getLanguage()]
  return { title: copy.meta.title, description: copy.meta.description }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await getLanguage()
  const copy = messages[lang]
  const profile = await currentProfile()

  return (
    <html
      lang={lang}
      className={`${noto.variable} ${notoBengali.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <Header copy={copy} lang={lang} email={profile?.email ?? null} isAdmin={profile?.role === 'admin'} />
        {children}
      </body>
    </html>
  )
}
