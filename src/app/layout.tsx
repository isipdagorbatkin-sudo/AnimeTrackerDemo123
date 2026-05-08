import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/layout/Navigation'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { Analytics } from '@vercel/analytics/next'
import { SakuraAnimation } from '@/components/effects/SakuraAnimation'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'AnimeTracker - Персональный командный центр аниме',
  description: 'Отслеживай, открывай и управляй своей аниме-вселенной в одном премиальном пространстве',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userData = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    userData = profile
  }

  const showNavigation = !!user?.id

  return (
    <html lang="ru" className="dark">
      <body className={`${inter.className} antialiased`}>
        <SakuraAnimation />
        {showNavigation ? (
          <>
            <Navigation
              username={userData?.username}
              avatarUrl={userData?.avatar_url}
            />
            <main className="min-h-screen md:pl-64 pt-14 md:pt-0 pb-20 md:pb-0 transition-all duration-300">
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
        <Analytics />
      </body>
    </html>
  )
}
