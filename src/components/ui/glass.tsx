import { cn } from '@/lib/utils'

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  blur?: number
  opacity?: number
}

export function Glass({ children, className, blur = 12, opacity = 0.4, ...props }: GlassProps) {
  return (
    <div
      className={cn(
        'glass',
        className
      )}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        background: `rgba(20, 20, 40, ${opacity})`,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'dark' | 'light'
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  const variants = {
    default: 'bg-gradient-to-br from-blue-900/20 via-cyan-900/10 to-blue-900/20 backdrop-blur-xl border border-blue-500/20',
    dark: 'bg-gradient-to-br from-gray-900/40 via-blue-900/30 to-gray-900/40 backdrop-blur-xl border border-blue-500/30',
    light: 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-blue-500/10 backdrop-blur-xl border border-blue-400/30',
  }

  return (
    <div
      className={cn(
        'rounded-2xl shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-500',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'dark' | 'light'
}

export function GlassPanel({ children, className, variant = 'default', ...props }: GlassPanelProps) {
  const variants = {
    default: 'bg-gradient-to-br from-blue-900/30 via-cyan-900/20 to-blue-900/30 backdrop-blur-2xl border border-blue-500/30',
    dark: 'bg-gradient-to-br from-gray-900/50 via-blue-900/40 to-gray-900/50 backdrop-blur-2xl border border-blue-500/40',
    light: 'bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-500/20 backdrop-blur-2xl border border-blue-400/40',
  }

  return (
    <div
      className={cn(
        'rounded-3xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export function GlassButton({ children, className, variant = 'primary', size = 'md', ...props }: GlassButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105',
    secondary: 'bg-gradient-to-r from-gray-700 via-blue-700 to-gray-700 hover:from-gray-600 hover:via-blue-600 hover:to-gray-600 text-white border border-blue-500/30 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-105',
    ghost: 'bg-transparent hover:bg-blue-600/20 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-500/50 hover:scale-105',
    danger: 'bg-gradient-to-r from-red-600 via-pink-600 to-red-600 hover:from-red-700 hover:via-pink-700 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-105',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  }

  return (
    <button
      className={cn(
        'rounded-xl font-medium transition-all duration-300 backdrop-blur-sm',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
