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
  Users,
  MessageSquare,
  Sparkles,
  Settings,
  ChevronLeft,
  Flame,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Дашборд', icon: Home },
  { href: '/collection', label: 'Коллекция', icon: BookOpen },
  { href: '/search', label: 'Поиск', icon: Search },
  { href: '/friends', label: 'Друзья', icon: Users },
  { href: '/chat', label: 'Сообщения', icon: MessageSquare },
]

const bottomItems = [
  { href: '/profile/settings', label: 'Настройки', icon: Settings },
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
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden md:flex flex-col h-screen border-r border-sidebar-border/60 transition-all duration-300 ease-out',
          collapsed ? 'w-20' : 'w-64'
        )}
        style={{
          background: 'linear-gradient(180deg, rgba(8,9,16,0.97) 0%, rgba(12,14,24,0.98) 100%)',
          backdropFilter: 'blur(32px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        {/* Logo */}
        <div className={cn(
          'relative flex items-center border-b border-sidebar-border/40 px-5',
          collapsed ? 'justify-center h-16 px-0' : 'h-16'
        )}>
          {collapsed ? (
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 blur-lg -z-10 animate-pulse-glow" />
            </div>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-500/30">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-purple-500/25 to-blue-500/25 blur-lg -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-sidebar-foreground">
                  AnimeTracker
                </span>
                <span className="block text-[0.6rem] text-sidebar-accent-foreground font-medium tracking-widest uppercase">
                  Премиум хаб
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'absolute -right-3 top-[3.25rem] z-50 hidden md:flex items-center justify-center w-6 h-6 rounded-full',
            'border border-sidebar-border/50 bg-sidebar text-sidebar-foreground/40',
            'hover:text-sidebar-foreground hover:border-purple-500/30',
            'transition-all duration-200 shadow-lg',
            collapsed && 'rotate-180'
          )}
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        {/* Main Nav */}
        <nav className="relative flex-1 px-3 py-5 space-y-0.5">
          <div className={cn('px-3 pb-3', collapsed && 'text-center')}>
            {!collapsed && (
              <span className="text-[0.6rem] font-semibold tracking-widest uppercase text-sidebar-muted-foreground/40">
                Меню
              </span>
            )}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'text-sidebar-foreground'
                    : 'text-sidebar-muted-foreground hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/12 to-purple-500/5 border border-purple-500/10" />
                )}
                <div className={cn(
                  'relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 z-10',
                  isActive
                    ? 'bg-purple-500/15 text-purple-400 shadow-sm shadow-purple-500/10'
                    : 'text-sidebar-muted-foreground group-hover:bg-sidebar-accent/50 group-hover:text-sidebar-foreground'
                )}>
                  <Icon className="h-[1.125rem] w-[1.125rem]" />
                  {isActive && (
                    <>
                      <div className="absolute inset-0 rounded-lg bg-purple-500/10 animate-pulse-glow opacity-60" />
                      <div className="absolute -inset-0.5 rounded-lg bg-purple-500/5 blur-sm -z-10" />
                    </>
                  )}
                </div>
                {!collapsed && <span className="z-10">{item.label}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto w-1 h-5 rounded-full bg-gradient-to-b from-purple-500 to-purple-400 shadow-sm shadow-purple-500/40 z-10" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Profile Section */}
        <div className="relative border-t border-sidebar-border/40 p-3">
          {collapsed ? (
            <div className="flex justify-center">
              <UserMenu username={username} avatarUrl={avatarUrl} />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-1">
              <UserMenu username={username} avatarUrl={avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {username || 'Пользователь'}
                </p>
                <p className="text-[0.65rem] text-sidebar-muted-foreground/60 truncate">
                  Онлайн
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
