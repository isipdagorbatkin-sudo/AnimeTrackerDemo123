'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  BookOpen,
  CircleDot,
  Home,
  MessageSquare,
  Search,
  Sparkles,
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

  return (
    <header className="fixed left-0 right-0 top-0 z-50 hidden h-12 items-center border-b border-[#242428] bg-[#111113]/92 px-5 font-[var(--font-display)] text-sm text-white/70 backdrop-blur-xl md:flex">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <img
            src="/anime-tracker-mark.svg"
            alt=""
            className="h-8 w-8 rounded-sm"
            width={32}
            height={32}
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-white transition-colors group-hover:text-primary">
              AnimeTracker
            </span>
            <span className="-mt-0.5 text-[0.62rem] font-bold text-primary/80">аниме-трекер</span>
          </span>
        </Link>

        <span className="h-5 w-px bg-white/20" />
        <CircleDot className="h-4 w-4 text-white/55" />
        <span className="h-5 w-px bg-white/20" />

        <nav className="flex min-w-0 items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-8 items-center gap-2 px-3 transition-colors hover:bg-[#232326] hover:text-white',
                  active && 'bg-[#232326] text-white'
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', active && 'text-primary')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
        className="mx-6 hidden h-8 w-[32vw] max-w-[470px] items-center justify-between border border-white/20 bg-[#111113] px-3 text-white/45 transition-colors hover:border-white/35 lg:flex"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search
        </span>
        <span className="flex items-center gap-1 text-[0.65rem]">
          <kbd className="border border-white/25 px-1 leading-none">ctrl</kbd>
          <kbd className="border border-white/25 px-1 leading-none">k</kbd>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-5">
        <UserMenu username={username} avatarUrl={avatarUrl} />
      </div>
    </header>
  )
}
