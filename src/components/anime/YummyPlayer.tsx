'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Play, RotateCcw, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'

interface YummyEpisode {
  id: string
  number: number
  label: string
  iframeUrl: string
  duration?: number
  views?: number
}

interface YummySource {
  key: string
  player: string
  dubbing: string
  episodes: YummyEpisode[]
}

interface YummyPlayerProps {
  animeTitle: string
  fallbackTitles?: string[]
  idMal?: number | null
  year?: number | null
  episodes?: number | null
}

type SourceMenuTab = 'dubbing' | 'player'

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function cleanPlayerName(value: string): string {
  return value.replace(/^Плеер\s+/i, '').trim() || value
}

function cleanDubbingName(value: string): string {
  return value.replace(/^Озвучка\s+/i, '').trim() || value
}

export function YummyPlayer({ animeTitle, fallbackTitles, idMal, year, episodes }: YummyPlayerProps) {
  const [sources, setSources] = useState<YummySource[]>([])
  const [animeName, setAnimeName] = useState('')
  const [selectedSourceKey, setSelectedSourceKey] = useState('')
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sourceMenuTab, setSourceMenuTab] = useState<SourceMenuTab>('dubbing')

  const selectedSource = useMemo(
    () => sources.find((source) => source.key === selectedSourceKey) || sources[0] || null,
    [selectedSourceKey, sources]
  )

  const selectedEpisode = useMemo(() => {
    if (!selectedSource) return null
    return selectedSource.episodes.find((episode) => episode.id === selectedEpisodeId) || selectedSource.episodes[0] || null
  }, [selectedEpisodeId, selectedSource])

  const providers = useMemo(() => [...new Set(sources.map((source) => source.player))], [sources])

  const providerSources = useMemo(() => {
    if (!selectedSource) return []
    return sources.filter((source) => source.player === selectedSource.player)
  }, [selectedSource, sources])

  const loadYummy = useCallback(async () => {
    setLoading(true)
    setError('')
    setSources([])
    setAnimeName('')
    setSelectedSourceKey('')
    setSelectedEpisodeId('')
    setSourceMenuTab('dubbing')

    try {
      const queries = [animeTitle, ...(fallbackTitles || [])].filter((value, index, list) => value && list.indexOf(value) === index)
      const params = new URLSearchParams({ q: animeTitle })
      for (const fallback of queries.slice(1)) params.append('fallback', fallback)
      if (idMal) params.set('idMal', String(idMal))
      if (year) params.set('year', String(year))
      if (episodes) params.set('episodes', String(episodes))

      const res = await fetch(`/api/yummy/search?${params.toString()}`)
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'YummyAnime не нашёл видео')

      const list: YummySource[] = data.sources || []
      const firstSource = list[0]
      const firstEpisode = firstSource?.episodes?.[0]
      if (!firstSource || !firstEpisode) throw new Error('YummyAnime вернул пустой список серий')

      setSources(list)
      setAnimeName(data.anime?.title || '')
      setSelectedSourceKey(firstSource.key)
      setSelectedEpisodeId(firstEpisode.id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка YummyAnime'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [animeTitle, episodes, fallbackTitles, idMal, year])

  useEffect(() => {
    if (!animeTitle) return
    void loadYummy()
  }, [animeTitle, loadYummy])

  const selectSource = (source: YummySource) => {
    const episodeNumber = selectedEpisode?.number
    const nextEpisode = source.episodes.find((episode) => episode.number === episodeNumber) || source.episodes[0]
    setSelectedSourceKey(source.key)
    setSelectedEpisodeId(nextEpisode?.id || '')
  }

  const selectProvider = (player: string) => {
    const source = sources.find((item) => item.player === player)
    if (source) selectSource(source)
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/35 bg-black shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
        {selectedEpisode?.iframeUrl ? (
          <iframe
            key={selectedEpisode.iframeUrl}
            src={selectedEpisode.iframeUrl}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_28%_18%,rgba(239,68,68,0.18),transparent_34%),linear-gradient(135deg,#101014,#18181f)]">
            {loading ? (
              <div className="text-center">
                <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Ищем альтернативный плеер...</p>
              </div>
            ) : (
              <div className="max-w-md p-5 text-center">
                <Play className="mx-auto mb-3 h-12 w-12 text-primary/45" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/55 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Tv className="h-4 w-4 text-primary" />
              Экспериментальные плееры
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedSource
                ? `${animeName || animeTitle} · ${cleanPlayerName(selectedSource.player)} · ${cleanDubbingName(selectedSource.dubbing)}`
                : 'Ищет CVH, Holles, Collapse, AniBoom и запасные провайдеры по названию карточки и MAL id.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadYummy()}
            disabled={loading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background/45 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {sources.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-[#151616] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.22)]">
          <div className="mb-3 flex border-b border-border/40">
            <button
              type="button"
              onClick={() => setSourceMenuTab('dubbing')}
              className={cn(
                'relative h-11 px-5 text-left text-base font-semibold transition-colors sm:text-lg',
                sourceMenuTab === 'dubbing' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Озвучка
              {sourceMenuTab === 'dubbing' && <span className="absolute inset-x-3 bottom-[-1px] h-px bg-primary" />}
            </button>
            <button
              type="button"
              onClick={() => setSourceMenuTab('player')}
              className={cn(
                'relative h-11 px-5 text-left text-base font-semibold transition-colors sm:text-lg',
                sourceMenuTab === 'player' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Плеер
              {sourceMenuTab === 'player' && <span className="absolute inset-x-3 bottom-[-1px] h-px bg-primary" />}
            </button>
          </div>

          {sourceMenuTab === 'player' ? (
            <div className="space-y-2">
              {providers.map((player) => {
                const active = selectedSource?.player === player
                return (
                  <button
                    key={player}
                    type="button"
                    onClick={() => {
                      selectProvider(player)
                      setSourceMenuTab('dubbing')
                    }}
                    className={cn(
                      'flex h-12 w-full items-center rounded-lg px-4 text-left text-base font-semibold transition-colors',
                      active
                        ? 'bg-muted/70 text-primary'
                        : 'text-muted-foreground hover:bg-muted/35 hover:text-foreground'
                    )}
                  >
                    {cleanPlayerName(player)}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {providerSources.map((source) => {
                const active = source.key === selectedSourceKey
                return (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() => selectSource(source)}
                    className={cn(
                      'flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-4 py-2 text-left transition-colors',
                      active
                        ? 'bg-muted/70 text-primary'
                        : 'text-muted-foreground hover:bg-muted/35 hover:text-foreground'
                    )}
                  >
                    <span className="min-w-0 truncate text-base font-semibold">{cleanDubbingName(source.dubbing)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{source.episodes.length} серий</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {selectedSource && selectedSource.episodes.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Серии ({selectedSource.episodes.length})</p>
            {selectedEpisode?.duration ? (
              <p className="text-xs text-muted-foreground">Длительность: {formatDuration(selectedEpisode.duration)}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {selectedSource.episodes.map((episode) => (
              <button
                key={episode.id}
                type="button"
                onClick={() => setSelectedEpisodeId(episode.id)}
                disabled={loading}
                className={cn(
                  'flex aspect-[3/2] items-center justify-center rounded-lg border text-xs font-medium transition-all',
                  selectedEpisode?.id === episode.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30'
                    : 'border-border/30 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {episode.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
