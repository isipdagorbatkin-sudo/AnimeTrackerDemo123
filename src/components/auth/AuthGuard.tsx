'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn, Sparkles, Flame } from 'lucide-react'
import Link from 'next/link'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    check()
  }, [])

  if (loading) return <>{children}</>

  if (!user) {
    return (
      <>
        {children}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl md:left-60">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                <Flame className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-muted-foreground truncate">
                Войдите, чтобы добавлять аниме в коллекцию, общаться с друзьями и отслеживать прогресс
              </p>
            </div>
            <Link href="/login" className="shrink-0">
              <Button size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return <>{children}</>
}
