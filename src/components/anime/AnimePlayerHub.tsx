'use client'

import { Radio, ShieldCheck, Sparkles } from 'lucide-react'
import { KodikPlayer } from '@/components/anime/KodikPlayer'

interface AnimePlayerHubProps {
  animeTitle: string
  fallbackTitles?: string[]
  idMal?: number | null
  year?: number | null
  episodes?: number | null
}

export function AnimePlayerHub({ animeTitle, fallbackTitles, idMal, year, episodes }: AnimePlayerHubProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/35 bg-card/45 shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
      <div className="border-b border-border/30 bg-[radial-gradient(circle_at_12%_0%,rgba(239,68,68,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Radio className="h-4 w-4 text-primary" />
              Kodik
            </div>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
              Сейчас это единственный источник, который открывается автоматически без ручных ссылок.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-border/30 bg-background/35 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0">
            Нерабочие источники убраны, чтобы пользователь не упирался в ручной ввод ссылок.
          </span>
        </div>

        <KodikPlayer
          animeTitle={animeTitle}
          fallbackTitles={fallbackTitles}
          idMal={idMal}
          year={year}
          episodes={episodes}
        />
      </div>
    </div>
  )
}
