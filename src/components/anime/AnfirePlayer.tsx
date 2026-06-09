'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Loader2, Play, RotateCcw, Search, Server } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnfireEpisodeSource {
  url: string | null
  resolution: string
  status: 'ONLINE' | 'OFFLINE'
}

interface AnfireEpisode {
  episode: number
  data: AnfireEpisodeSource[]
}

interface AnfireAnime {
  anime_slug: string
  anime_title?: string | null
  anime_title1?: string | null
  anime_info?: string | null
  episodes: AnfireEpisode[]
  matched_by: 'slug' | 'link' | 'title'
}

interface AnfirePlayerProps {
  animeTitle: string
  fallbackTitles?: string[]
  episodes?: number | null
}

const QUALITY_ORDER = ['1080p', '1080', '720p', '720', '480p', '480', '360p', '360']

function isIframeUrl(url: string): boolean {
  return /blogger\.com|youtube\.com|drive\.google\.com/.test(url)
}

function pickBestSource(sources: AnfireEpisodeSource[]): AnfireEpisodeSource | null {
  const online = sources.filter((source) => source.url && source.status === 'ONLINE')
  if (!online.length) return null
  return QUALITY_ORDER
    .map((quality) => online.find((source) => source.resolution.toLowerCase().includes(quality.replace('p', ''))))
    .find(Boolean) || online[0]
}

export function AnfirePlayer({ animeTitle, fallbackTitles, episodes: expectedEpisodes }: AnfirePlayerProps) {
  const [anime, setAnime] = useState<AnfireAnime | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [selectedUrl, setSelectedUrl] = useState('')
  const [selectedResolution, setSelectedResolution] = useState('')
  const [manualLink, setManualLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentEpisode = useMemo(
    () => anime?.episodes.find((episode) => episode.episode === selectedEpisode) || null,
    [anime, selectedEpisode]
  )

  const selectSource = useCallback((source: AnfireEpisodeSource | null) => {
    if (!source?.url) {
      setSelectedUrl('')
      setSelectedResolution('')
      return
    }
    setSelectedUrl(source.url)
    setSelectedResolution(source.resolution)
  }, [])

  const selectEpisode = useCallback((episode: AnfireEpisode) => {
    setSelectedEpisode(episode.episode)
    selectSource(pickBestSource(episode.data))
  }, [selectSource])

  const loadAnfire = useCallback(async (link?: string) => {
    setLoading(true)
    setError('')
    setAnime(null)
    setSelectedUrl('')
    setSelectedResolution('')

    try {
      const params = new URLSearchParams()
      if (animeTitle) params.set('title', animeTitle)
      for (const fallback of fallbackTitles || []) params.append('fallback', fallback)
      if (expectedEpisodes) params.set('episodes', String(expectedEpisodes))
      if (link) params.set('link', link)

      const res = await fetch(`/api/anfire/search?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AnFire не нашел видео')
      }

      setAnime(data.anime)
      const firstEpisode = data.anime.episodes?.[0]
      if (firstEpisode) selectEpisode(firstEpisode)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка AnFire'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [animeTitle, expectedEpisodes, fallbackTitles, selectEpisode])

  useEffect(() => {
    if (!animeTitle) return
    void loadAnfire()
  }, [animeTitle, loadAnfire])

  useEffect(() => {
    if (!videoRef.current || !selectedUrl || isIframeUrl(selectedUrl)) return
    videoRef.current.src = selectedUrl
    videoRef.current.load()
    videoRef.current.play().catch(() => {})
  }, [selectedUrl])

  const handleManualSubmit = () => {
    if (!manualLink.trim()) return
    void loadAnfire(manualLink.trim())
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border/35 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
        {selectedUrl ? (
          isIframeUrl(selectedUrl) ? (
            <iframe
              key={selectedUrl}
              src={selectedUrl}
              className="h-full w-full"
              allowFullScreen
              allow="autoplay; fullscreen"
              referrerPolicy="no-referrer"
            />
          ) : (
            <video ref={videoRef} controls className="h-full w-full" playsInline preload="metadata" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.16),transparent_35%),linear-gradient(135deg,#101014,#18181f)]">
            {loading ? (
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Пробуем найти AnimeFire через AnFire...</p>
              </div>
            ) : (
              <div className="max-w-md p-5 text-center">
                <Play className="mx-auto mb-3 h-12 w-12 text-primary/45" />
                <p className="text-sm text-muted-foreground">{error || 'Выберите эпизод'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/55 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Server className="h-4 w-4 text-primary" />
              AnFireAPI / AnimeFire
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {anime
                ? `${anime.anime_title1 || anime.anime_title || anime.anime_slug} · ${anime.episodes.length} эп.`
                : 'Автопоиск может не сработать, если у AnimeFire другое название.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={manualLink}
              onChange={(event) => setManualLink(event.target.value)}
              placeholder="Ссылка AnimeFire"
              className="h-9 min-w-0 rounded-xl border border-border/50 bg-background/55 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/45 sm:w-64"
            />
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={loading || !manualLink.trim()}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Найти
            </button>
            <a
              href="https://github.com/MestreTM/AnFireAPI-Anime-Player"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/45 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
            >
              GitHub
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {currentEpisode && currentEpisode.data.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {currentEpisode.data.filter((source) => source.url).map((source) => (
            <button
              key={`${currentEpisode.episode}-${source.resolution}-${source.url}`}
              type="button"
              onClick={() => selectSource(source)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                selectedResolution === source.resolution
                  ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'border-border/40 bg-card/55 hover:border-primary/40 hover:bg-primary/5'
              )}
            >
              {source.resolution}
            </button>
          ))}
        </div>
      )}

      {anime && anime.episodes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Эпизоды ({anime.episodes.length})</p>
            <button
              type="button"
              onClick={() => void loadAnfire(manualLink.trim() || undefined)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/45 hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Обновить
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {anime.episodes.map((episode) => (
              <button
                key={episode.episode}
                type="button"
                onClick={() => selectEpisode(episode)}
                disabled={loading || episode.data.length === 0}
                className={cn(
                  'flex aspect-[3/2] items-center justify-center rounded-lg border text-xs font-medium transition-all',
                  selectedEpisode === episode.episode
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'border-border/30 bg-card/50 hover:border-primary/40 hover:bg-primary/5',
                  episode.data.length === 0 && 'cursor-not-allowed opacity-45'
                )}
              >
                {episode.episode}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
