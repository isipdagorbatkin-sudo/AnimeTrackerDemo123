'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Loader2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KodikResult {
  id: string
  link: string
  title: string
  title_orig?: string
  other_title?: string
  year?: number
  episodes_count?: number
  last_episode?: number
  match_score?: number
  translation?: {
    id: number
    title: string
    type: 'voice' | 'subtitles'
  }
  material_data?: {
    year?: number
    episodes_total?: number
    episodes_aired?: number
  }
}

interface KodikPlayerProps {
  animeTitle: string
  fallbackTitles?: string[]
  idMal?: number | null
  year?: number | null
  episodes?: number | null
}

function getEmbedLink(result: KodikResult): string {
  return result.link.startsWith('http') ? result.link : `https:${result.link}`
}

function getEpisodeCount(result: KodikResult): number | null {
  return Number(
    result.episodes_count ||
    result.last_episode ||
    result.material_data?.episodes_total ||
    result.material_data?.episodes_aired ||
    0
  ) || null
}

function getResultLabel(result: KodikResult): string {
  const title = result.title || result.title_orig || result.other_title || 'Kodik'
  const releaseYear = result.year || result.material_data?.year
  const episodeCount = getEpisodeCount(result)
  return [title, releaseYear, episodeCount ? `${episodeCount} ep.` : null].filter(Boolean).join(' / ')
}

function resultKey(result: KodikResult): string {
  return `${result.id}:${result.translation?.id || 'default'}:${result.link}`
}

export function KodikPlayer({ animeTitle, fallbackTitles, idMal, year, episodes }: KodikPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [results, setResults] = useState<KodikResult[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const doSearch = useCallback(async (title: string) => {
    setLoading(true)
    setError('')
    setEmbedUrl(null)
    setResults([])
    setSelectedId('')
    setShowMenu(false)

    try {
      const queries = [title, ...(fallbackTitles || [])].filter((v, i, a) => v && a.indexOf(v) === i)
      const params = new URLSearchParams({ q: title })
      for (const fallback of queries.slice(1)) params.append('fallback', fallback)
      if (idMal) params.set('idMal', String(idMal))
      if (year) params.set('year', String(year))
      if (episodes) params.set('episodes', String(episodes))

      const res = await fetch(`/api/kodik/search?${params.toString()}`)
      const data = await res.json()
      const list: KodikResult[] = data.success ? data.results || [] : []
      const found = list[0]

      if (!found) {
        setError(`Anime was not found in Kodik: "${title}"`)
        return
      }

      setResults(list.slice(0, 12))
      setSelectedId(resultKey(found))
      setEmbedUrl(getEmbedLink(found))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown'
      setError(`Kodik error: ${message}`)
    } finally {
      setLoading(false)
    }
  }, [episodes, fallbackTitles, idMal, year])

  useEffect(() => {
    if (!animeTitle) return
    const timer = window.setTimeout(() => {
      void doSearch(animeTitle)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [animeTitle, doSearch])

  const handleSelect = (result: KodikResult) => {
    setSelectedId(resultKey(result))
    setEmbedUrl(getEmbedLink(result))
    setShowMenu(false)
  }

  const selected = results.find((result) => resultKey(result) === selectedId)

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        {embedUrl ? (
          <iframe
            key={embedUrl}
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
                <p className="text-sm text-muted-foreground">Searching Kodik...</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Play className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {results.length > 1 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(v => !v)}
            className="flex max-w-full items-center gap-2 rounded-xl border border-border/40 bg-card/60 px-4 py-2 text-left text-sm hover:border-primary/40"
          >
            <span className="truncate">
              {selected?.translation?.title || 'Kodik'}: {selected ? getResultLabel(selected) : 'select source'}
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', showMenu && 'rotate-180')} />
          </button>
          {showMenu && (
            <div className="absolute left-0 top-full z-20 mt-1 max-h-80 w-full min-w-[280px] overflow-y-auto rounded-xl border border-border/50 bg-card py-1 shadow-xl">
              {results.map((result) => {
                const key = resultKey(result)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm transition-colors hover:bg-muted/50',
                      key === selectedId && 'font-medium text-primary'
                    )}
                  >
                    <span className="block truncate">{result.translation?.title || 'Kodik'}</span>
                    <span className="block truncate text-xs text-muted-foreground">{getResultLabel(result)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}
    </div>
  )
}
