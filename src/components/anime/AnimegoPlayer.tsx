'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, Play, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimegoEpisode {
  seria: number
  title: string
  airDate: string
  isReleased: boolean
}

interface AnimegoVoice {
  label: string
  translationId: string
  player: string
  embed: string
  cvhId: string | null
}

interface AnimegoStream {
  mp4s: string[]
  hls: string | null
  dash: string | null
}

interface AnimegoPlayerProps {
  animeTitle: string
}

export function AnimegoPlayer({ animeTitle }: AnimegoPlayerProps) {
  const [episodes, setEpisodes] = useState<AnimegoEpisode[]>([])
  const [voices, setVoices] = useState<AnimegoVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<AnimegoVoice | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [selectedAnimeId, setSelectedAnimeId] = useState('')
  const [stream, setStream] = useState<AnimegoStream | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Поиск аниме...')
  const videoRef = useRef<HTMLVideoElement>(null)

  const doSearchAndSelect = useCallback(async (query: string) => {
    if (!query || query.length < 2) return
    setLoading(true)
    setError('')
    setStatusMessage('Поиск аниме...')

    try {
      const res = await fetch(`/api/animego/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!data.success || data.results.length === 0) {
        setError('Аниме не найдено на AnimeGO')
        setLoading(false)
        return
      }

      const anime = data.results[0]
      setSelectedAnimeId(anime.id)
      setStatusMessage('Загрузка эпизодов...')

      const [epRes, voicesRes] = await Promise.all([
        fetch(`/api/animego/episodes?id=${anime.id}`),
        fetch(`/api/animego/voices?id=${anime.id}&episode=1`),
      ])
      const epData = await epRes.json()
      const voicesData = await voicesRes.json()

      if (epData.success) {
        const released = epData.episodes.filter((e: AnimegoEpisode) => e.isReleased)
        setEpisodes(released)
      }

      if (voicesData.success && voicesData.voices.length > 0) {
        setVoices(voicesData.voices)
        setSelectedVoice(voicesData.voices[0])
      }

      if (epData.success) {
        const released = epData.episodes.filter((e: AnimegoEpisode) => e.isReleased)
        if (released.length > 0) {
          setStatusMessage('')
          loadEpisodeStream(released[0].seria, voicesData.voices?.[0] || null, anime.id)
        } else {
          setStatusMessage('Нет доступных эпизодов')
          setLoading(false)
        }
      } else {
        setStatusMessage('')
        setLoading(false)
      }
    } catch {
      setError('Ошибка поиска на AnimeGO')
      setLoading(false)
    }
  }, [])

  const loadEpisodeStream = useCallback(async (episodeNum: number, voice: AnimegoVoice | null, animeId?: string) => {
    const v = voice || selectedVoice
    const aId = animeId || selectedAnimeId
    if (!v || !aId) return

    setSelectedEpisode(episodeNum)
    setStream(null)
    setLoading(true)
    setError('')
    setStatusMessage('Загрузка видео...')

    try {
      if (v.cvhId) {
        const res = await fetch(
          `/api/animego/stream?cvh_id=${v.cvhId}&season=1&episode=${episodeNum}&translation=${encodeURIComponent(v.label)}`
        )
        const data = await res.json()
        if (data.success) {
          setStream(data.stream)
        } else {
          throw new Error(data.error || 'No stream')
        }
      } else if (v.player === 'kodik' && v.embed) {
        window.open(v.embed, '_blank')
      } else {
        throw new Error('Нет CVH ID для потока')
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки видео')
    } finally {
      setLoading(false)
    }
  }, [selectedAnimeId, selectedVoice])

  useEffect(() => {
    if (animeTitle) {
      doSearchAndSelect(animeTitle)
    }
  }, [animeTitle, doSearchAndSelect])

  useEffect(() => {
    if (videoRef.current && stream?.mp4s?.length) {
      const bestQuality = stream.mp4s.find((u: string) => u.includes('720') || u.includes('1080') || u.includes('1920')) || stream.mp4s[0]
      videoRef.current.src = bestQuality
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  const selectEpisode = useCallback((ep: number) => {
    loadEpisodeStream(ep, null)
  }, [loadEpisodeStream])

  const PlayableVideo = () => {
    if (!stream) return null

    const mp4Url = stream.mp4s.find(u => u.includes('720') || u.includes('1080') || u.includes('1920')) || stream.mp4s[0]

    if (mp4Url) {
      return (
        <video
          ref={videoRef}
          controls
          className="w-full h-full"
          playsInline
          preload="metadata"
        >
          <source src={mp4Url} type="video/mp4" />
        </video>
      )
    }

    if (stream.hls) {
      return <HlsPlayer url={stream.hls} />
    }

    if (stream.dash) {
      return <div className="text-muted-foreground text-sm p-4">DASH не поддерживается в браузере</div>
    }

    return <div className="text-muted-foreground text-sm p-4">Видео недоступно</div>
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        {selectedEpisode && stream ? (
          <PlayableVideo />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {loading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {statusMessage || 'Загрузка...'}
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Play className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {error || 'Выберите эпизод'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {voices.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/30 hover:border-primary/40 transition-colors text-sm"
          >
            {selectedVoice?.label || 'Озвучка'}
            <ChevronDown className={cn('h-4 w-4 transition-transform', showVoiceMenu && 'rotate-180')} />
          </button>
          {showVoiceMenu && (
            <div className="absolute top-full mt-1 left-0 bg-card border border-border/50 rounded-xl shadow-xl z-10 py-1 min-w-[200px]">
              {voices.map((v) => (
                <button
                  key={v.translationId}
                  onClick={() => { setSelectedVoice(v); setShowVoiceMenu(false); loadEpisodeStream(selectedEpisode || 1, v) }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors',
                    selectedVoice?.translationId === v.translationId && 'text-primary font-medium'
                  )}
                >
                  {v.label}
                  <span className="text-xs ml-1 opacity-60">({v.player})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {episodes.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Эпизоды ({episodes.length})
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
            {episodes.map((ep) => (
              <button
                key={ep.seria}
                onClick={() => selectEpisode(ep.seria)}
                disabled={loading}
                className={cn(
                  'aspect-[3/2] flex items-center justify-center rounded-lg text-xs font-medium transition-all border',
                  selectedEpisode === ep.seria
                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                    : 'bg-card/50 border-border/30 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {ep.seria}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HlsPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current || !url) return

    let hls: any = null

    const initHls = async () => {
      try {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported() && videoRef.current) {
          hls = new Hls()
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = url
        }
      } catch {}
    }

    initHls()

    return () => {
      if (hls) hls.destroy()
    }
  }, [url])

  return (
    <video
      ref={videoRef}
      controls
      className="w-full h-full"
      playsInline
      preload="metadata"
    />
  )
}
