'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Loader2, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { KodikAnime, KodikEpisode, getKodikPlayerUrl, searchAnimeByShikimoriId } from '@/lib/kodik/client'
import { ShikimoriAnime } from '@/lib/shikimori/client'

interface KodikPlayerProps {
  anime: ShikimoriAnime
}

function isExactShikimoriMatch(item: KodikAnime, shikimoriId: number): boolean {
  return item.shikimori_id === String(shikimoriId)
}

function getTranslationLabel(item: KodikAnime): string {
  return item.translation?.title || item.title || 'Kodik'
}

interface SeasonEntry {
  key: string
  title: string
  link: string
  episodes: Record<string, KodikEpisode>
}

interface EpisodeEntry {
  key: string
  title: string
  link: string
}

function sortNumericKeys<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort(([a], [b]) => Number(a) - Number(b))
}

function getSeasonEntries(item: KodikAnime | null): SeasonEntry[] {
  if (!item?.seasons) return []

  return sortNumericKeys(Object.entries(item.seasons)).map(([key, season]) => ({
    key,
    title: season.title || `Сезон ${key}`,
    link: season.link,
    episodes: season.episodes || {},
  }))
}

function getEpisodeEntries(season: SeasonEntry | undefined): EpisodeEntry[] {
  if (!season) return []

  return sortNumericKeys(Object.entries(season.episodes)).map(([key, episode]) => {
    const episodeLink = typeof episode === 'string' ? episode : episode.link
    const episodeTitle = typeof episode === 'string' ? '' : episode.title

    return {
      key,
      title: episodeTitle || `Серия ${key}`,
      link: episodeLink || season.link,
    }
  }).filter((episode) => episode.link)
}

export function KodikPlayer({ anime }: KodikPlayerProps) {
  const [players, setPlayers] = useState<KodikAnime[]>([])
  const [player, setPlayer] = useState<KodikAnime | null>(null)
  const [selectedSeasonKey, setSelectedSeasonKey] = useState('')
  const [selectedEpisodeKey, setSelectedEpisodeKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setActivePlayer(item: KodikAnime | null) {
    const nextSeasons = getSeasonEntries(item)
    const nextSeason = nextSeasons[0]
    const nextEpisode = getEpisodeEntries(nextSeason)[0]

    setPlayer(item)
    setSelectedSeasonKey(nextSeason?.key || '')
    setSelectedEpisodeKey(nextEpisode?.key || '')
  }

  useEffect(() => {
    let cancelled = false

    async function loadPlayer() {
      setLoading(true)
      setError('')
      setPlayers([])
      setActivePlayer(null)

      try {
        const exactResponse = await searchAnimeByShikimoriId(anime.id)
        const exactMatches = (exactResponse.results || []).filter((item) => isExactShikimoriMatch(item, anime.id))

        if (cancelled) return

        if (exactMatches.length > 0) {
          setPlayers(exactMatches)
          setActivePlayer(exactMatches[0])
          return
        }

        setError('Для этого тайтла не найден проверенный плеер Kodik.')
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить плеер Kodik. Попробуйте позже.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlayer()

    return () => {
      cancelled = true
    }
  }, [anime])

  const seasons = getSeasonEntries(player)
  const selectedSeason = seasons.find((season) => season.key === selectedSeasonKey) || seasons[0]
  const episodes = getEpisodeEntries(selectedSeason)
  const selectedEpisode = episodes.find((episode) => episode.key === selectedEpisodeKey) || episodes[0]
  const selectedContentLink = selectedEpisode?.link || selectedSeason?.link || player?.link
  const playerUrl = getKodikPlayerUrl(selectedContentLink)

  return (
    <Card className="glass overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <PlayCircle className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h3 className="font-semibold leading-tight">Смотреть онлайн</h3>
              {player?.translation?.title && (
                <p className="text-xs text-muted-foreground truncate">
                  {player.translation.title}
                </p>
              )}
            </div>
          </div>
          {playerUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(playerUrl, '_blank', 'noopener,noreferrer')}
            >
              Открыть
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : playerUrl ? (
          <div className="space-y-3 p-3">
            {players.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Озвучка</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {players.map((item) => (
                    <Button
                      key={item.id}
                      size="sm"
                      variant={item.id === player?.id ? 'default' : 'outline'}
                      className="shrink-0"
                      onClick={() => setActivePlayer(item)}
                    >
                      {getTranslationLabel(item)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {seasons.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Сезон</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {seasons.map((season) => (
                    <Button
                      key={season.key}
                      size="sm"
                      variant={season.key === selectedSeason?.key ? 'default' : 'outline'}
                      className="shrink-0"
                      onClick={() => {
                        const firstEpisode = getEpisodeEntries(season)[0]
                        setSelectedSeasonKey(season.key)
                        setSelectedEpisodeKey(firstEpisode?.key || '')
                      }}
                    >
                      {season.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {episodes.length > 1 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Серия</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {episodes.map((episode) => (
                    <Button
                      key={episode.key}
                      size="sm"
                      variant={episode.key === selectedEpisode?.key ? 'default' : 'outline'}
                      className="shrink-0"
                      onClick={() => setSelectedEpisodeKey(episode.key)}
                    >
                      {episode.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={playerUrl}
                title={`Kodik player: ${anime.russian || anime.name}`}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p>{error || 'Плеер недоступен.'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
