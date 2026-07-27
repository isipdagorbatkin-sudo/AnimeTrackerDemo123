'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Library, Search, BarChart3, Sparkles, User, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/dashboard', label: 'Хаб', icon: Sparkles },
  { href: '/collection', label: 'Коллекция', icon: Library },
  { href: '/statistics', label: 'Статы', icon: BarChart3 },
  { href: '/search', label: 'Поиск', icon: Search },
]

interface MobileNavigationProps {
  userId?: string | null
}

export function MobileNavigation({ userId }: MobileNavigationProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-3 left-3 right-3 md:hidden z-50 font-[var(--font-display)]">
      <div className="flex items-center justify-around h-15 px-2 rounded-sm bg-[#111113]/95 border border-[#343438] backdrop-blur-xl shadow-[0_25px_50px_rgba(0,0,0,0.55)]">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 min-w-0"
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-sm transition-colors duration-150',
                isActive && 'bg-primary/15 shadow-[0_0_16px_rgba(239,68,68,0.22)]'
              )}>
                <Icon className={cn(
                  'h-[1.125rem] w-[1.125rem] transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[0.5rem] font-medium transition-colors duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}

        <Link
          href={userId ? `/profile/${userId}` : '/login'}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 min-w-0"
        >
          <div className={cn(
            'flex items-center justify-center w-8 h-8 rounded-sm transition-colors duration-150',
            (pathname.startsWith('/profile') || pathname === '/login') && 'bg-primary/15 shadow-[0_0_16px_rgba(239,68,68,0.22)]'
          )}>
            {userId ? (
              <User className={cn(
                'h-[1.125rem] w-[1.125rem] transition-colors duration-150',
                pathname.startsWith('/profile') ? 'text-primary' : 'text-muted-foreground'
              )} />
            ) : (
              <LogIn className="h-[1.125rem] w-[1.125rem] transition-colors duration-150 text-muted-foreground" />
            )}
          </div>
          <span className={cn(
            'text-[0.5rem] font-medium transition-colors duration-150',
            (pathname.startsWith('/profile') || pathname === '/login') ? 'text-primary' : 'text-muted-foreground'
          )}>
            {userId ? 'Профиль' : 'Вход'}
          </span>
        </Link>
      </div>
    </nav>
  )
}
