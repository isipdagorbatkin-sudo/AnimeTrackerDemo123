import { cn } from '@/lib/utils'

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function Glass({ children, className, ...props }: GlassProps) {
  return (
    <div
      className={cn(
        'glass rounded-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
