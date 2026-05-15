'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Search, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Главная', icon: Home },
  { href: '/dashboard', label: 'Хаб', icon: BookOpen },
  { href: '/search', label: 'Поиск', icon: Search },
  { href: '/chat', label: 'Чаты', icon: MessageSquare },
]

export function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-3 left-3 right-3 md:hidden z-50">
      <div className="flex items-center justify-around h-14 px-2 rounded-2xl bg-sidebar/85 border border-sidebar-border backdrop-blur-xl shadow-2xl shadow-black/40">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-14 gap-0.5"
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150',
                isActive && 'bg-primary/15 shadow-[0_0_16px_rgba(168,85,247,0.25)]'
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
      </div>
    </nav>
  )
}
