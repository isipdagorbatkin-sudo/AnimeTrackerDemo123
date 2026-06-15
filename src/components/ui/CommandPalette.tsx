'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Compass, Home, Loader2, Search, Sparkles, User } from 'lucide-react'
import { searchWithRussian } from '@/lib/search'
import { getCoverImage, type AniListAnime } from '@/lib/anilist/client'
import { getProxiedImageUrl } from '@/lib/image-proxy'

const quickActions = [
  { label: 'Главная', href: '/', icon: Home },
  { label: 'Каталог', href: '/#anime-catalog', icon: Compass },
  { label: 'Коллекция', href: '/collection', icon: BookOpen },
  { label: 'Дашборд', href: '/dashboard', icon: Sparkles },
  { label: 'Профиль', href: '/profile/settings', icon: User },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AniListAnime[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    if (!open) return
    const value = query.trim()
    if (value.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    let cancelled = false
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchWithRussian(value, 1, 6)
        if (!cancelled) setResults(data.media || [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [open, query])

  const visibleActions = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return quickActions
    return quickActions.filter((action) => action.label.toLowerCase().includes(value))
  }, [query])

  const closeAndGo = (href: string) => {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] bg-black/62 backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
      <div
        className="mx-auto mt-20 w-[min(720px,calc(100vw-24px))] overflow-hidden rounded-sm border border-white/15 bg-[#111113] shadow-[0_28px_80px_rgba(0,0,0,0.58)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск аниме или команда..."
            className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <kbd className="border border-white/20 px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">esc</kbd>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-2">
          {visibleActions.length > 0 && (
            <div className="mb-2">
              <div className="px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Команды</div>
              {visibleActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.href}
                    type="button"
                    onClick={() => closeAndGo(action.href)}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Аниме</div>
              {results.map((anime) => {
                const image = getProxiedImageUrl(getCoverImage(anime))
                const title = anime.title?.romaji || anime.title?.english || anime.title?.native || 'Без названия'
                return (
                  <button
                    key={anime.id}
                    type="button"
                    onClick={() => closeAndGo(`/anime/${anime.id}`)}
                    className="grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    {image ? (
                      <img src={image} alt="" className="h-14 w-10 rounded-sm object-cover" />
                    ) : (
                      <span className="h-14 w-10 rounded-sm bg-muted" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[anime.startDate?.year, anime.format].filter(Boolean).join(' / ') || 'аниме'}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">↵</span>
                  </button>
                )
              })}
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && visibleActions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Ничего не найдено</div>
          )}
        </div>
      </div>
    </div>
  )
}
