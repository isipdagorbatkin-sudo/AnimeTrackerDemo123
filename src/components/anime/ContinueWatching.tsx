'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, X } from 'lucide-react'

type ContinueItem = {
  animeId?: number | null
  animeTitle: string
  player: string
  dubbing: string
  episodeNumber: number
  updatedAt: number
}

const STORAGE_KEY = 'anime-player:continue'

export function saveContinueWatching(item: ContinueItem) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(item))
    window.dispatchEvent(new Event('continue-watching-updated'))
  } catch {}
}

export function ContinueWatching() {
  const [item, setItem] = useState<ContinueItem | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const load = () => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as ContinueItem | null
        setItem(parsed?.animeTitle ? parsed : null)
        setHidden(false)
      } catch {
        setItem(null)
      }
    }
    load()
    window.addEventListener('storage', load)
    window.addEventListener('continue-watching-updated', load)
    return () => {
      window.removeEventListener('storage', load)
      window.removeEventListener('continue-watching-updated', load)
    }
  }, [])

  if (!item || hidden) return null

  const href = item.animeId ? `/anime/${item.animeId}#anime-player-episodes` : '#'

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[min(520px,calc(100vw-24px))] -translate-x-1/2 md:bottom-5">
      <div className="flex items-center gap-3 rounded-sm border border-white/15 bg-[#111113]/95 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.48)] backdrop-blur-xl">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <Play className="h-5 w-5 fill-current" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Продолжить: {item.animeTitle}</span>
            <span className="block truncate text-xs text-muted-foreground">
              Серия {item.episodeNumber} / {item.player} / {item.dubbing}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="Скрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
