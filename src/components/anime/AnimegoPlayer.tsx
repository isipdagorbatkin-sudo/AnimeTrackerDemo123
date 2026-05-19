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
  const [searchResults, setSearchResults] = useState<{ id: string; link: string; title: string }[]>([])
  const [selectedAnime, setSelectedAnime] = useState<{ id: string; link: string } | null>(null)
  const [episodes, setEpisodes] = useState<AnimegoEpisode[]>([])
  const [voices, setVoices] = useState<AnimegoVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<AnimegoVoice | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [stream, setStream] = useState<AnimegoStream | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)
  const [showAuto, setShowAuto] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const doSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) return
    setSearchLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/animego/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (data.success && data.results.length > 0) {
        setSearchResults(data.results.slice(0, 5))
        setShowResults(true)
      }
    } catch {
      setError('Ошибка поиска')
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const selectAnime = useCallback(async (id: string, link: string) => {
    setSelectedAnime({ id, link })
    setShowResults(false)
    setSelectedEpisode(null)
    setStream(null)
    setLoading(true)
    setError('')

    try {
      const [epRes, voicesRes] = await Promise.all([
        fetch(`/api/animego/episodes?id=${id}`),
        fetch(`/api/animego/voices?id=${id}&episode=1`),
      ])
      const epData = await epRes.json()
      const voicesData = await voicesRes.json()

      if (epData.success) setEpisodes(epData.episodes)
      if (voicesData.success && voicesData.voices.length > 0) {
        setVoices(voicesData.voices)
        setSelectedVoice(voicesData.voices[0])
      }
    } catch {
      setError('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadEpisode = useCallback(async (episodeNum: number) => {
    if (!selectedVoice || !selectedAnime) return
    setSelectedEpisode(episodeNum)
    setStream(null)
    setLoading(true)
    setError('')

    try {
      if (selectedVoice.cvhId) {
        const res = await fetch(
          `/api/animego/stream?cvh_id=${selectedVoice.cvhId}&season=1&episode=${episodeNum}&translation=${encodeURIComponent(selectedVoice.label)}`
        )
        const data = await res.json()
        if (data.success) setStream(data.stream)
        else throw new Error(data.error || 'No stream')
      } else if (selectedVoice.player === 'kodik') {
        if (selectedVoice.embed) {
          setStream({ mp4s: [], hls: null, dash: null })
          window.open(selectedVoice.embed, '_blank')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки видео')
    } finally {
      setLoading(false)
    }
  }, [selectedVoice, selectedAnime])

  useEffect(() => {
    if (showAuto && animeTitle) {
      doSearch(animeTitle)
    }
  }, [animeTitle, showAuto, doSearch])

  useEffect(() => {
    if (videoRef.current && stream?.mp4s?.length) {
      const bestQuality = stream.mp4s.find((u: string) => u.includes('720') || u.includes('1080')) || stream.mp4s[0]
      videoRef.current.src = bestQuality
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  const PlayableVideo = () => {
    if (!stream) return null

    const mp4Url = stream.mp4s.find(u => u.includes('720') || u.includes('1080')) || stream.mp4s[0]

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
      return <div className="text-muted-foreground text-sm p-4">DASH streaming not supported in browser</div>
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
            {searchLoading || loading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchLoading ? 'Поиск...' : 'Загрузка...'}
                </p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Play className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                {!selectedAnime ? (
                  <p className="text-sm text-muted-foreground">Выберите аниме</p>
                ) : !episodes.length ? (
                  <p className="text-sm text-muted-foreground">Выберите эпизод</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Нажмите на эпизод</p>
                )}
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

      {searchLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Поиск аниме...
        </div>
      ) : showResults && searchResults.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground mb-1">Найдено на AnimeGO:</p>
          {searchResults.map((r) => (
            <button
              key={r.id}
              onClick={() => selectAnime(r.id, r.link)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                selectedAnime?.id === r.id
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card/50 border-border/30 hover:border-primary/40'
              )}
            >
              {r.title}
            </button>
          ))}
        </div>
      ) : showAuto && !selectedAnime ? (
        <div className="text-center py-2">
          <button
            onClick={() => setShowAuto(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Не найдено? Ввести ссылку вручную
          </button>
        </div>
      ) : !showAuto && !selectedAnime ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Название аниме для поиска на AnimeGO..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-card/50 border border-border/40 text-sm focus:outline-none focus:border-primary/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') doSearch((e.target as HTMLInputElement).value)
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>('[placeholder*="AnimeGO"]')
              if (input) doSearch(input.value)
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            Найти
          </button>
        </div>
      ) : null}

      {selectedAnime && voices.length > 0 && (
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
                  onClick={() => { setSelectedVoice(v); setShowVoiceMenu(false); setStream(null); setSelectedEpisode(null) }}
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

      {selectedAnime && episodes.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
          {episodes.filter(e => e.isReleased).map((ep) => (
            <button
              key={ep.seria}
              onClick={() => loadEpisode(ep.seria)}
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
