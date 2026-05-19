'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Play, ChevronDown, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JutsuSeasonData {
  season: number
  seasonName: string
  episodes: { number: number; url: string }[]
}

interface JutsuPlayerProps {
  animeUrl: string
  seasons: JutsuSeasonData[]
  onError?: (error: string) => void
}

interface Mp4Links {
  [quality: string]: string
}

const QUALITY_ORDER = ['1080', '720', '480', '360']

export function JutsuPlayer({ animeUrl, seasons, onError }: JutsuPlayerProps) {
  const [selectedSeason, setSelectedSeason] = useState(0)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [mp4Links, setMp4Links] = useState<Mp4Links | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedQuality, setSelectedQuality] = useState('')
  const [showSeasonMenu, setShowSeasonMenu] = useState(false)
  const [useProxy, setUseProxy] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentSeason = seasons[selectedSeason]

  function getVideoUrl(quality: string, links: Mp4Links, proxy: boolean): string {
    const url = links[quality]
    if (!url) return ''
    return proxy ? `/api/jutsu/video?url=${encodeURIComponent(url)}` : url
  }

  const videoUrl = selectedQuality && mp4Links ? getVideoUrl(selectedQuality, mp4Links, useProxy) : ''

  const loadEpisode = useCallback(async (seasonIdx: number, episodeIdx: number) => {
    const season = seasons[seasonIdx]
    if (!season) return
    const episode = season.episodes[episodeIdx]
    if (!episode) return

    setLoading(true)
    setError('')
    setMp4Links(null)
    setSelectedQuality('')
    setSelectedEpisode(episodeIdx)
    setVideoError(false)

    try {
      const res = await fetch(`/api/jutsu/episode?url=${encodeURIComponent(episode.url)}`)
      const data = await res.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to load episode')
      }
      setMp4Links(data.links)
      const bestQuality = QUALITY_ORDER.find(q => data.links[q]) || Object.keys(data.links)[0]
      setSelectedQuality(bestQuality || '')
    } catch (err: any) {
      const msg = err.message || 'Ошибка загрузки эпизода'
      setError(msg)
      onError?.(msg)
    } finally {
      setLoading(false)
    }
  }, [seasons, onError])

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      setVideoError(false)
      videoRef.current.src = videoUrl
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [videoUrl])

  const handleEpisodeClick = (epIdx: number) => {
    loadEpisode(selectedSeason, epIdx)
  }

  const handleSeasonChange = (idx: number) => {
    setSelectedSeason(idx)
    setSelectedEpisode(null)
    setMp4Links(null)
    setShowSeasonMenu(false)
  }

  const handleVideoError = () => {
    setVideoError(true)
    if (!useProxy) {
      setError('Не удалось загрузить видео напрямую. Попробуйте включить прокси.')
    }
  }

  if (!currentSeason) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет доступных эпизодов
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        {videoUrl ? (
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            playsInline
            preload="metadata"
            onError={handleVideoError}
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {loading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Загрузка...</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Play className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Выберите эпизод для просмотра</p>
              </div>
            )}
          </div>
        )}
      </div>

      {mp4Links && Object.keys(mp4Links).length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {QUALITY_ORDER.filter(q => mp4Links[q]).map(quality => (
            <button
              key={quality}
              onClick={() => {
                setSelectedQuality(quality)
                if (videoRef.current && mp4Links[quality]) {
                  const newUrl = getVideoUrl(quality, mp4Links, useProxy)
                  const currentTime = videoRef.current.currentTime
                  videoRef.current.src = newUrl
                  videoRef.current.currentTime = currentTime
                  videoRef.current.play().catch(() => {})
                }
              }}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                selectedQuality === quality
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card/50 border border-border/30 hover:border-primary/40'
              )}
            >
              {quality}p
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
          <span className="mt-0.5">⚠️</span>
          <div className="flex-1">{error}</div>
        </div>
      )}

      {videoError && !useProxy && mp4Links && (
        <button
          onClick={() => setUseProxy(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors"
        >
          <ShieldAlert className="h-4 w-4" />
          Включить прокси (если видео не загружается в вашем регионе)
        </button>
      )}

      {useProxy && (
        <div className="text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
          Видео загружается через прокси. Если воспроизведение прерывается, попробуйте
          выбрать более низкое качество или отключить прокси.
        </div>
      )}

      {seasons.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setShowSeasonMenu(!showSeasonMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/30 hover:border-primary/40 transition-colors"
          >
            <span className="text-sm font-medium">{currentSeason.seasonName}</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', showSeasonMenu && 'rotate-180')} />
          </button>
          {showSeasonMenu && (
            <div className="absolute top-full mt-1 left-0 bg-card border border-border/50 rounded-xl shadow-xl z-10 py-1 min-w-[160px]">
              {seasons.map((s, idx) => (
                <button
                  key={s.season}
                  onClick={() => handleSeasonChange(idx)}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors',
                    idx === selectedSeason && 'text-primary font-medium'
                  )}
                >
                  {s.seasonName}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
        {currentSeason.episodes.map((ep) => (
          <button
            key={ep.number}
            onClick={() => handleEpisodeClick(ep.number - 1)}
            disabled={loading}
            className={cn(
              'aspect-[3/2] flex items-center justify-center rounded-lg text-xs font-medium transition-all border',
              selectedEpisode === ep.number - 1
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                : 'bg-card/50 border-border/30 hover:border-primary/40 hover:bg-primary/5'
            )}
          >
            {ep.number}
          </button>
        ))}
      </div>
    </div>
  )
}
