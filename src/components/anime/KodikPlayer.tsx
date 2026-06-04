'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ExternalLink, Loader2, Play, ShieldCheck } from 'lucide-react'
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
  screenshots?: string[]
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
  return [title, releaseYear, episodeCount ? `${episodeCount} эп.` : null].filter(Boolean).join(' / ')
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
        setError(`Не удалось надежно найти видео для "${title}". Лучше ничего не включать, чем открыть другой тайтл.`)
        return
      }

      setResults(list.slice(0, 12))
      setSelectedId(resultKey(found))
      setEmbedUrl(getEmbedLink(found))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown'
      setError(`Ошибка Kodik: ${message}`)
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
      <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Если в Kodik лезет реклама</p>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-foreground-secondary">
                <li>Установите AdGuard для браузера или Windows.</li>
                <li>Обновите страницу после установки.</li>
                <li>Если реклама осталась, включите фильтр раздражителей в настройках AdGuard.</li>
              </ol>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                Встроить блокировщик прямо в сайт нельзя: Kodik открыт внутри iframe, а расширения ставятся только пользователем в браузер.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-44">
            <a
              href="https://adguard.com/ru/adguard-browser-extension/overview.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Расширение
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://adguard.com/ru/download.html?os=windows&show=1"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/60 bg-background/45 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-muted/50"
            >
              Для Windows
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

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
                <p className="text-sm text-muted-foreground">Ищем подходящее видео...</p>
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
              {selected?.translation?.title || 'Kodik'}: {selected ? getResultLabel(selected) : 'выберите источник'}
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
