import type { Metadata } from 'next'
import { Inter, Space_Mono } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/layout/Navigation'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { Analytics } from '@vercel/analytics/next'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { ScrollMemory } from '@/components/ui/ScrollMemory'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'AnimeTracker — Твой аниме-трекер',
  description: 'Отслеживай аниме, собирай коллекцию, общайся с друзьями',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/anime-tracker-mark.svg',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userData: { username?: string; avatar_url?: string | null } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    userData = profile
  }

  const showNavigation = true

  return (
    <html lang="ru" className="dark">
      <body className={`${inter.variable} ${spaceMono.variable} antialiased`}>
        {showNavigation ? (
          <>
            <Navigation
              username={userData?.username}
              avatarUrl={userData?.avatar_url}
            />
            <main className="min-h-screen pt-12 pb-16 md:pb-0 transition-all duration-200">
              <div className="page-enter">
                {children}
              </div>
            </main>
            <MobileNavigation />
          </>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
        <ScrollMemory />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}
