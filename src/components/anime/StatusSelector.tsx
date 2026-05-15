'use client'

import { cn } from '@/lib/utils'

type AnimeStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped'

interface StatusSelectorProps {
  value: AnimeStatus
  onChange: (value: AnimeStatus) => void
}

const statuses: { value: AnimeStatus; label: string; dot: string }[] = [
  { value: 'watching', label: 'Смотрю', dot: 'bg-emerald-500' },
  { value: 'completed', label: 'Просмотрено', dot: 'bg-cyan-500' },
  { value: 'plan_to_watch', label: 'В планах', dot: 'bg-purple-500' },
  { value: 'dropped', label: 'Брошено', dot: 'bg-destructive' },
]

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 border',
            value === s.value
              ? 'border-primary/40 bg-primary/10 text-foreground shadow-[0_0_20px_rgba(168,85,247,0.15)]'
              : 'border-border/30 bg-white/[0.02] text-muted-foreground hover:border-border/60 hover:text-foreground hover:bg-white/[0.04]'
          )}
        >
          <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
          {s.label}
        </button>
      ))}
    </div>
  )
}
