'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogIn, UserPlus, Flame, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface GuestBannerProps {
  variant?: 'banner' | 'card' | 'inline'
  className?: string
}

export function GuestBanner({ variant = 'banner', className }: GuestBannerProps) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
  }, [])

  if (loading || user || dismissed) return null

  if (variant === 'inline') {
    return (
      <div className={cn(
        'glass rounded-2xl p-5 sm:p-6 text-center',
        className
      )}>
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-base font-bold mb-1.5">Войдите, чтобы открыть всё</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
          Добавляйте аниме в коллекцию, ставьте оценки, общайтесь с друзьями и отслеживайте прогресс просмотра.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link href="/login">
            <Button size="sm" className="gap-1.5 rounded-sm">
              <LogIn className="h-3.5 w-3.5" />
              Войти
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" variant="outline" className="gap-1.5 rounded-sm border-white/15 bg-[#111113]/60 hover:border-primary/40 hover:bg-primary/10">
              <UserPlus className="h-3.5 w-3.5" />
              Регистрация
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        'glass rounded-2xl p-4 sm:p-5 flex items-center gap-4',
        className
      )}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Хотите в коллекцию?</p>
          <p className="text-xs text-muted-foreground">Войдите, чтобы сохранять и оценивать аниме</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href="/login">
            <Button size="sm" className="h-8 gap-1 rounded-sm text-xs">
              <LogIn className="h-3 w-3" />
              Войти
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'fixed bottom-20 left-0 right-0 z-50 border-t border-white/10 bg-[#111113]/95 backdrop-blur-xl md:bottom-0 md:left-60',
      'pb-[env(safe-area-inset-bottom)]',
      className
    )}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Войдите, чтобы добавлять аниме в коллекцию и отслеживать прогресс
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/login">
            <Button size="sm" className="h-8 gap-1 rounded-sm text-xs">
              <LogIn className="h-3 w-3" />
              Войти
            </Button>
          </Link>
          <Link href="/register" className="hidden sm:inline-flex">
            <Button size="sm" variant="outline" className="h-8 gap-1 rounded-sm text-xs border-white/15 bg-transparent hover:border-primary/40 hover:bg-primary/10">
              <UserPlus className="h-3 w-3" />
              Регистрация
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
