'use client'

import { useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, Loader2 } from 'lucide-react'

type KodikFrameResult = {
  screenshots?: string[]
}

interface AnimeFramesStripProps {
  title: string
  fallbackTitles?: string[]
  idMal?: number | null
  year?: number | null
  episodes?: number | null
}

function normalizeFrames(results: KodikFrameResult[]): string[] {
  const frames = results.flatMap(result => result.screenshots || [])
  return [...new Set(frames)].filter(Boolean).slice(0, 12)
}

export function AnimeFramesStrip({ title, fallbackTitles, idMal, year, episodes }: AnimeFramesStripProps) {
  const [frames, setFrames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const queryString = useMemo(() => {
    if (!title) return ''
    const params = new URLSearchParams({ q: title })
    for (const fallback of fallbackTitles || []) {
      if (fallback && fallback !== title) params.append('fallback', fallback)
    }
    if (idMal) params.set('idMal', String(idMal))
    if (year) params.set('year', String(year))
    if (episodes) params.set('episodes', String(episodes))
    return params.toString()
  }, [episodes, fallbackTitles, idMal, title, year])

  useEffect(() => {
    if (!queryString) return
    let cancelled = false

    const loadFrames = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/kodik/search?${queryString}`)
        const data = await res.json()
        if (!cancelled && data.success) {
          setFrames(normalizeFrames(data.results || []))
        }
      } catch {
        if (!cancelled) setFrames([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadFrames()
    return () => {
      cancelled = true
    }
  }, [queryString])

  if (loading && frames.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-border bg-muted/25">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    )
  }

  if (frames.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-border bg-muted/25 text-sm text-muted-foreground">
        <ImageIcon className="mr-2 h-4 w-4" />
        Кадры пока не найдены
      </div>
    )
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3">
        {frames.map((frame, index) => (
          <div
            key={frame}
            className="group relative h-36 w-[15.5rem] shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-lg shadow-black/20 sm:h-40 sm:w-72"
          >
            <img
              src={frame}
              alt={`Кадр ${index + 1}`}
              className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-90"
              loading="lazy"
            />
            <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[0.65rem] font-medium text-white/85 backdrop-blur">
              кадр {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
