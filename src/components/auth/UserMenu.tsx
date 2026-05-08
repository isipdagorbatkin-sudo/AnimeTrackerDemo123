'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Sparkles } from 'lucide-react'

interface UserMenuProps {
  username?: string
  avatarUrl?: string | null
}

export function UserMenu({ username, avatarUrl }: UserMenuProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadUserId = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        console.error('Ошибка при загрузке ID пользователя:', error)
      }
    }
    loadUserId()
  }, [mounted])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Ошибка при выходе:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!mounted) {
    return (
      <div className="relative">
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="relative cursor-pointer group">
          <Avatar className="transition-all duration-200 group-hover:ring-purple-500/40">
            <AvatarImage src={avatarUrl || undefined} alt={username} />
            <AvatarFallback>{username ? getInitials(username) : 'U'}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar shadow-sm" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={12}>
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Avatar size="sm">
              <AvatarImage src={avatarUrl || undefined} alt={username} />
              <AvatarFallback>{username ? getInitials(username) : 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">{username || 'Пользователь'}</p>
              <p className="text-[0.65rem] text-muted-foreground/50 mt-0.5">Онлайн</p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => userId && router.push(`/profile/${userId}`)}>
          <User className="mr-2 h-4 w-4" />
          <span>Профиль</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/profile/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Настройки</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={loading} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{loading ? 'Выход...' : 'Выйти'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
