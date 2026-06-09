'use client'

import { useMemo, useState } from 'react'
import { Radio, ShieldCheck, Sparkles, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KodikPlayer } from '@/components/anime/KodikPlayer'
import { YummyPlayer } from '@/components/anime/YummyPlayer'

type PlayerSource = 'kodik' | 'yummy'

interface AnimePlayerHubProps {
  animeTitle: string
  fallbackTitles?: string[]
  idMal?: number | null
  year?: number | null
  episodes?: number | null
}

const SOURCES: {
  id: PlayerSource
  label: string
  description: string
  icon: typeof Radio
}[] = [
  {
    id: 'kodik',
    label: 'Kodik',
    description: 'Много озвучек и iframe-плеер',
    icon: Radio,
  },
  {
    id: 'yummy',
    label: 'Эксперимент',
    description: 'CVH/Sibnet и другие провайдеры',
    icon: Tv,
  }
]

export function AnimePlayerHub({ animeTitle, fallbackTitles, idMal, year, episodes }: AnimePlayerHubProps) {
  const [activeSource, setActiveSource] = useState<PlayerSource>('kodik')
  const activeMeta = useMemo(() => SOURCES.find((source) => source.id === activeSource) || SOURCES[0], [activeSource])

  return (
    <div className="overflow-hidden rounded-3xl border border-border/35 bg-card/45 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
      <div className="border-b border-border/30 bg-[radial-gradient(circle_at_12%_0%,rgba(239,68,68,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Автоплеер
            </div>
            <h4 className="text-lg font-bold sm:text-xl">Смотреть без лишней возни</h4>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Открываешь карточку, сайт сам ищет видео. Если доступно несколько вариантов, выбери нужную озвучку или источник под плеером.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[420px]">
            {SOURCES.map((source) => {
              const Icon = source.icon
              const active = source.id === activeSource
              return (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setActiveSource(source.id)}
                  className={cn(
                    'group rounded-2xl border p-3 text-left transition-all',
                    active
                      ? 'border-primary/45 bg-primary/15 shadow-[0_14px_35px_rgba(239,68,68,0.16)]'
                      : 'border-border/35 bg-background/35 hover:border-primary/30 hover:bg-muted/35'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl border transition-colors',
                      active ? 'border-primary/35 bg-primary text-primary-foreground' : 'border-border/45 bg-card/60 text-muted-foreground group-hover:text-foreground'
                    )}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-semibold">{source.label}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{source.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border/30 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">
            Сейчас выбран {activeMeta.label}. Alloha и Aksor убраны, тут показываются CVH, Holles, Collapse, AniBoom или Sibnet, если источник нашёл их для тайтла.
          </span>
        </div>

        {activeSource === 'kodik' && (
          <KodikPlayer
            animeTitle={animeTitle}
            fallbackTitles={fallbackTitles}
            idMal={idMal}
            year={year}
            episodes={episodes}
          />
        )}

        {activeSource === 'yummy' && (
          <YummyPlayer
            animeTitle={animeTitle}
            fallbackTitles={fallbackTitles}
            idMal={idMal}
            year={year}
            episodes={episodes}
          />
        )}
      </div>
    </div>
  )
}
