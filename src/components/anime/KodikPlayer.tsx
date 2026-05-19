'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Play, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const KODIK_TOKEN = '56a768d08f43091901c44b54fe970049'
const KODIK_API = 'https://kodik-api.com/search'

interface KodikTranslation {
  id: number
  title: string
  type: 'voice' | 'subtitles'
}

interface KodikResult {
  id: string
  type: string
  link: string
  title: string
  title_orig: string
  translation: KodikTranslation
  shikimori_id: string
  episodes_count?: number
  seasons?: Record<string, {
    link: string
    episodes: Record<string, string>
  }>
}

interface KodikPlayerProps {
  animeTitle: string
}

async function searchKodikDirect(title: string): Promise<KodikResult[]> {
  const url = `${KODIK_API}?token=${KODIK_TOKEN}&title=${encodeURIComponent(title)}&limit=20&with_material_data=true&with_seasons=true&with_episodes=true`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export function KodikPlayer({ animeTitle }: KodikPlayerProps) {
  const [results, setResults] = useState<KodikResult[]>([])
  const [selected, setSelected] = useState<KodikResult | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<string>('')
  const [selectedSeason, setSelectedSeason] = useState<string>('1')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTranslationMenu, setShowTranslationMenu] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Поиск...')

  const doSearch = useCallback(async (title: string) => {
    if (!title || title.length < 2) return
    setLoading(true)
    setError('')
    setStatusMessage('Поиск...')

    try {
      let list = await searchKodikDirect(title)
      if (list.length === 0) {
        setError(`Аниме не найдено: "${title}"`)
        setLoading(false)
        return
      }

      const serials = list.filter(r => r.type === 'anime-serial')
      const movies = list.filter(r => r.type === 'anime')
      const pick = serials.length > 0 ? serials[0] : (movies[0] || list[0])

      setResults(list)
      setSelected(pick)

      if (pick.seasons) {
        const sKeys = Object.keys(pick.seasons).sort((a, b) => parseInt(a) - parseInt(b))
        const season = sKeys[0] || '1'
        setSelectedSeason(season)
        const eps = Object.keys(pick.seasons[season]?.episodes || {}).sort((a, b) => parseInt(a) - parseInt(b))
        setSelectedEpisode(eps[0] || '')
      } else {
        setSelectedEpisode('1')
      }

      setStatusMessage('')
      setLoading(false)
    } catch (err: any) {
      setError('Ошибка поиска: ' + (err.message || 'неизвестная'))
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (animeTitle) doSearch(animeTitle)
  }, [animeTitle, doSearch])

  const episodes = selected?.seasons?.[selectedSeason]?.episodes || {}
  const episodeKeys = Object.keys(episodes).sort((a, b) => parseInt(a) - parseInt(b))
  const seasonKeys = selected?.seasons ? Object.keys(selected.seasons).sort((a, b) => parseInt(a) - parseInt(b)) : []

  const otherTranslations = selected
    ? results.filter(r => r.translation.id !== selected.translation.id)
    : []

  const selectTranslation = useCallback((result: KodikResult) => {
    setSelected(result)
    setShowTranslationMenu(false)
    if (result.seasons) {
      const sKeys = Object.keys(result.seasons).sort((a, b) => parseInt(a) - parseInt(b))
      const season = sKeys[0] || '1'
      setSelectedSeason(season)
      const eps = Object.keys(result.seasons[season]?.episodes || {}).sort((a, b) => parseInt(a) - parseInt(b))
      setSelectedEpisode(eps[0] || '')
    } else {
      setSelectedEpisode('1')
    }
  }, [])

  const embedUrl = selectedEpisode && selected
    ? `https:${selected.seasons?.[selectedSeason]?.episodes?.[selectedEpisode] || selected.link}`
    : null

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {loading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Play className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{error || 'Выберите эпизод'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      {selected && (
        <div className="flex flex-wrap items-center gap-3">
          {otherTranslations.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTranslationMenu(!showTranslationMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/30 hover:border-primary/40 transition-colors text-sm"
              >
                {selected.translation.title}
                <ChevronDown className={cn('h-4 w-4 transition-transform', showTranslationMenu && 'rotate-180')} />
              </button>
              {showTranslationMenu && (
                <div className="absolute top-full mt-1 left-0 bg-card border border-border/50 rounded-xl shadow-xl z-10 py-1 min-w-[200px]">
                  {results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => selectTranslation(r)}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors',
                        selected.translation.id === r.translation.id && 'text-primary font-medium'
                      )}
                    >
                      {r.translation.title}
                      <span className="text-xs ml-1 opacity-60">
                        ({r.translation.type === 'subtitles' ? 'суб' : 'озвучка'})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {seasonKeys.length > 1 && (
            <div className="flex gap-1">
              {seasonKeys.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSeason(s)
                    const eps = Object.keys(selected.seasons?.[s]?.episodes || {}).sort((a, b) => parseInt(a) - parseInt(b))
                    setSelectedEpisode(eps[0] || '')
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    selectedSeason === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card/50 border-border/30 hover:border-primary/40'
                  )}
                >
                  Сезон {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {episodeKeys.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Эпизоды ({episodeKeys.length})
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
            {episodeKeys.map(ep => (
              <button
                key={ep}
                onClick={() => setSelectedEpisode(ep)}
                className={cn(
                  'aspect-[3/2] flex items-center justify-center rounded-lg text-xs font-medium transition-all border',
                  selectedEpisode === ep
                    ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30'
                    : 'bg-card/50 border-border/30 hover:border-primary/40 hover:bg-primary/5'
                )}
              >
                {ep}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
