'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { UserMenu } from '@/components/auth/UserMenu'
import { cn } from '@/lib/utils'
import {
  Home,
  BookOpen,
  Search,
  MessageSquare,
  Sparkles,
  BarChart3,
  ChevronLeft,
  Flame,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/dashboard', label: 'Дашборд', icon: Sparkles },
  { href: '/collection', label: 'Коллекция', icon: BookOpen },
  { href: '/statistics', label: 'Статистика', icon: BarChart3 },
  { href: '/search', label: 'Поиск', icon: Search },
  { href: '/chat', label: 'Сообщения', icon: MessageSquare },
]

interface NavigationProps {
  username?: string
  avatarUrl?: string | null
}

export function Navigation({ username, avatarUrl }: NavigationProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = collapsed ? 'true' : 'false'
  }, [collapsed])

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden md:flex flex-col h-screen bg-sidebar/88 border-r border-sidebar-border backdrop-blur-xl shadow-2xl shadow-black/30 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(200,143,90,0.1),transparent_42%)]" />
      {/* Logo */}
      <div className={cn(
        'relative z-10 flex items-center border-b border-sidebar-border h-14',
        collapsed ? 'justify-center' : 'px-4'
      )}>
        {collapsed ? (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Flame className="h-4 w-4 text-white" />
          </div>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-sidebar-foreground tracking-tight">
                  AnimeTracker
                </div>
                <div className="text-[0.55rem] font-semibold text-sidebar-accent-foreground/70 uppercase tracking-[0.3em]">
                  Трекинг аниме
                </div>
            </div>
          </Link>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-[2.75rem] z-50 hidden md:flex items-center justify-center w-5 h-5 rounded-full',
          'border border-sidebar-border bg-sidebar text-sidebar-muted-foreground shadow-lg shadow-black/30',
          'hover:text-sidebar-foreground hover:border-sidebar-ring hover:bg-sidebar-accent',
          'transition-all duration-200',
          collapsed && 'rotate-180'
        )}
      >
        <ChevronLeft className="h-2.5 w-2.5" />
      </button>

      {/* Main Nav */}
      <nav className="relative z-10 flex flex-col flex-1 px-2 py-4 space-y-0.5">
        {!collapsed && (
          <div className="px-2 pb-2">
            <span className="text-[0.55rem] font-semibold tracking-widest uppercase text-sidebar-muted-foreground/40">
              Меню
            </span>
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 w-full',
                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 h-9',
                isActive
                  ? 'bg-primary/15 text-sidebar-foreground shadow-[0_0_20px_rgba(200,143,90,0.16)]'
                  : 'text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <span className={cn(
                'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity duration-150',
                isActive && 'opacity-100'
              )} />
              <Icon className={cn(
                'h-[1.125rem] w-[1.125rem] shrink-0',
                isActive && 'text-primary'
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Profile Section */}
      <div className="relative z-10 border-t border-sidebar-border p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <UserMenu username={username} avatarUrl={avatarUrl} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <UserMenu username={username} avatarUrl={avatarUrl} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {username || 'Пользователь'}
              </p>
              <p className="text-[0.6rem] text-sidebar-muted-foreground/60 truncate">
                Онлайн
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
