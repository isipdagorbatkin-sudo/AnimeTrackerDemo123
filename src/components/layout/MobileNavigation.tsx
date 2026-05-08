'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Search, Users, MessageSquare, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/collection', label: 'Коллекция', icon: BookOpen },
  { href: '/search', label: 'Поиск', icon: Search },
  { href: '/friends', label: 'Друзья', icon: Users },
  { href: '/chat', label: 'Чаты', icon: MessageSquare },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50">
      {/* Ambient glow behind nav */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-around h-[4.25rem] px-2 backdrop-blur-2xl border-t border-border bg-sidebar/95">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-14 py-1 group"
            >
              <div className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-purple-500/12'
                  : 'group-hover:bg-white/5'
              )}>
                <Icon className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive
                    ? 'text-purple-400 scale-110'
                    : 'text-muted-foreground group-hover:text-foreground'
                )} />
                {isActive && (
                  <>
                    <div className="absolute inset-0 rounded-xl bg-purple-500/8 animate-pulse-glow" />
                    <div className="absolute -top-1 w-1 h-1 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
                  </>
                )}
              </div>
              <span className={cn(
                'text-[0.6rem] font-medium tracking-tight mt-0.5 transition-colors duration-200',
                isActive
                  ? 'text-purple-400'
                  : 'text-muted-foreground'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
