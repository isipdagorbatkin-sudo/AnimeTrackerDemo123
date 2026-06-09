'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Loader2, Play, RadioTower, RotateCcw, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnilibriaEpisode {
  id: string
  name?: string | null
  name_english?: string | null
  ordinal: number
  hls_480?: string | null
  hls_720?: string | null
  hls_1080?: string | null
  duration?: number | null
}

interface AnilibriaRelease {
  id: number
  alias: string
  year?: number | null
  name: {
    main?: string | null
    english?: string | null
    alternative?: string | null
  }
  episodes_total?: number | null
  external_player?: string | null
  episodes?: AnilibriaEpisode[]
}

interface AnilibriaPlayerProps {
  animeTitle: string
  fallbackTitles?: string[]
  year?: number | null
  episodes?: number | null
}

type Quality = '1080' | '720' | '480'
type PlaybackMode = 'iframe' | 'hls'

function getEpisodeUrl(episode: AnilibriaEpisode | null, quality: Quality): string {
  if (!episode) return ''
  if (quality === '1080') return episode.hls_1080 || episode.hls_720 || episode.hls_480 || ''
  if (quality === '720') return episode.hls_720 || episode.hls_1080 || episode.hls_480 || ''
  return episode.hls_480 || episode.hls_720 || episode.hls_1080 || ''
}

function availableQualities(episode: AnilibriaEpisode | null): Quality[] {
  if (!episode) return []
  return [
    episode.hls_1080 ? '1080' : null,
    episode.hls_720 ? '720' : null,
    episode.hls_480 ? '480' : null,
  ].filter(Boolean) as Quality[]
}

export function AnilibriaPlayer({ animeTitle, fallbackTitles, year, episodes: expectedEpisodes }: AnilibriaPlayerProps) {
  const [release, setRelease] = useState<AnilibriaRelease | null>(null)
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('')
  const [quality, setQuality] = useState<Quality>('720')
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('iframe')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const selectedEpisode = useMemo(
    () => release?.episodes?.find((episode) => episode.id === selectedEpisodeId) || null,
    [release, selectedEpisodeId]
  )
  const sourceUrl = useMemo(() => getEpisodeUrl(selectedEpisode, quality), [quality, selectedEpisode])
  const iframeUrl = release?.external_player || ''
  const qualities = useMemo(() => availableQualities(selectedEpisode), [selectedEpisode])

  const loadRelease = useCallback(async () => {
    setLoading(true)
    setError('')
    setRelease(null)
    setSelectedEpisodeId('')
    setShowEpisodeMenu(false)

    try {
      const queries = [animeTitle, ...(fallbackTitles || [])].filter((v, i, a) => v && a.indexOf(v) === i)
      const params = new URLSearchParams({ q: animeTitle })
      for (const fallback of queries.slice(1)) params.append('fallback', fallback)
      if (year) params.set('year', String(year))
      if (expectedEpisodes) params.set('episodes', String(expectedEpisodes))

      const res = await fetch(`/api/anilibria/search?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'AniLibria не нашла релиз')

      const foundRelease: AnilibriaRelease = data.release
      const firstEpisode = foundRelease.episodes?.[0]
      setRelease(foundRelease)
      setPlaybackMode(foundRelease.external_player ? 'iframe' : 'hls')
      if (firstEpisode) {
        setSelectedEpisodeId(firstEpisode.id)
        setQuality(firstEpisode.hls_1080 ? '1080' : firstEpisode.hls_720 ? '720' : '480')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка AniLibria'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [animeTitle, expectedEpisodes, fallbackTitles, year])

  useEffect(() => {
    if (!animeTitle) return
    void loadRelease()
  }, [animeTitle, loadRelease])

  useEffect(() => {
    if (playbackMode !== 'hls' || !videoRef.current || !sourceUrl) return
    let hls: any = null
    const video = videoRef.current

    const attach = async () => {
      try {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
          })
          hls.loadSource(sourceUrl)
          hls.attachMedia(video)
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = sourceUrl
        }
        video.play().catch(() => {})
      } catch {
        video.src = sourceUrl
      }
    }

    void attach()
    return () => {
      if (hls) hls.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [playbackMode, sourceUrl])

  const selectEpisode = (episode: AnilibriaEpisode) => {
    setSelectedEpisodeId(episode.id)
    setQuality(episode.hls_1080 ? '1080' : episode.hls_720 ? '720' : '480')
    setShowEpisodeMenu(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video overflow-hidden rounded-2xl border border-border/35 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
        {playbackMode === 'iframe' && iframeUrl ? (
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
          />
        ) : sourceUrl ? (
          <video
            ref={videoRef}
            controls
            className="h-full w-full"
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.16),transparent_35%),linear-gradient(135deg,#101014,#18181f)]">
            {loading ? (
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Ищем релиз на AniLibria...</p>
              </div>
            ) : (
              <div className="max-w-md p-5 text-center">
                <Play className="mx-auto mb-3 h-12 w-12 text-primary/45" />
                <p className="text-sm text-muted-foreground">{error || 'Выберите серию'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/55 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <RadioTower className="h-4 w-4 text-primary" />
              AniLibria
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {release
                ? `${release.name?.main || release.name?.english || 'Релиз'} · ${release.episodes?.length || 0} серий`
                : 'Русская озвучка AniLibria/AniLiberty, поиск по названию карточки.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRelease()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/45 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {release && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPlaybackMode('iframe')}
            disabled={!iframeUrl}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
              playbackMode === 'iframe'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/45 bg-card/55 text-muted-foreground hover:border-primary/35 hover:text-foreground'
            )}
          >
            <Tv className="h-4 w-4" />
            Встроенный плеер
          </button>
          <button
            type="button"
            onClick={() => setPlaybackMode('hls')}
            disabled={!sourceUrl}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
              playbackMode === 'hls'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/45 bg-card/55 text-muted-foreground hover:border-primary/35 hover:text-foreground'
            )}
          >
            <RadioTower className="h-4 w-4" />
            Прямой поток
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {selectedEpisode && playbackMode === 'hls' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEpisodeMenu((value) => !value)}
              className="inline-flex max-w-full items-center gap-2 rounded-xl border border-border/40 bg-card/60 px-4 py-2 text-left text-sm hover:border-primary/40"
            >
              <span className="truncate">
                Серия {selectedEpisode.ordinal}{selectedEpisode.name ? `: ${selectedEpisode.name}` : ''}
              </span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', showEpisodeMenu && 'rotate-180')} />
            </button>
            {showEpisodeMenu && (
              <div className="absolute left-0 top-full z-20 mt-1 max-h-80 w-full min-w-[280px] overflow-y-auto rounded-xl border border-border/50 bg-card py-1 shadow-xl">
                {release?.episodes?.map((episode) => (
                  <button
                    key={episode.id}
                    type="button"
                    onClick={() => selectEpisode(episode)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted/50',
                      episode.id === selectedEpisodeId && 'font-medium text-primary'
                    )}
                  >
                    <span className="block truncate">Серия {episode.ordinal}</span>
                    {(episode.name || episode.name_english) && (
                      <span className="block truncate text-xs text-muted-foreground">{episode.name || episode.name_english}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {qualities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {qualities.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuality(item)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                    quality === item
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'border-border/40 bg-card/55 hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  {item}p
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {release?.episodes && release.episodes.length > 0 && playbackMode === 'hls' && (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Серии ({release.episodes.length})</p>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {release.episodes.map((episode) => (
              <button
                key={episode.id}
                type="button"
                onClick={() => selectEpisode(episode)}
                disabled={loading}
                className={cn(
                  'flex aspect-[3/2] items-center justify-center rounded-lg border text-xs font-medium transition-all',
                  selectedEpisodeId === episode.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'border-border/30 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {episode.ordinal}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
