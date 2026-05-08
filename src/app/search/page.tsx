'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { JikanAnimeCard } from '@/components/anime/JikanAnimeCard'
import { JikanAnime } from '@/lib/jikan/types'
import { searchAnime } from '@/lib/jikan/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Sparkles, ChevronDown, Compass } from 'lucide-react'
import { searchLocalAnime, convertLocalToJikanArray } from '@/lib/local-anime/db'
import { buildSearchCandidates, hasCyrillic, normalizeSearchQuery } from '@/lib/search'
import { cn } from '@/lib/utils'

function dedupeAnime(list: JikanAnime[]): JikanAnime[] {
  const seen = new Set<number>()
  return list.filter((anime) => {
    if (seen.has(anime.mal_id)) return false
    seen.add(anime.mal_id)
    return true
  })
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JikanAnime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [remoteQuery, setRemoteQuery] = useState('')

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchCacheRef = useRef(new Map<string, { results: JikanAnime[]; hasMore: boolean; remoteQuery: string }>())
  const requestIdRef = useRef(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    clearTimeout(searchTimeoutRef.current)

    const normalizedQuery = normalizeSearchQuery(query)
    if (!normalizedQuery || normalizedQuery.length < 2) {
      setResults([])
      setHasMore(false)
      setRemoteQuery('')
      return
    }

    const cacheKey = normalizedQuery.toLowerCase()
    const cached = searchCacheRef.current.get(cacheKey)
    if (cached) {
      setResults(cached.results)
      setHasMore(cached.hasMore)
      setRemoteQuery(cached.remoteQuery)
      return
    }

    const localMatches = hasCyrillic(normalizedQuery)
      ? convertLocalToJikanArray(searchLocalAnime(normalizedQuery))
      : []

    if (localMatches.length > 0) {
      setResults(dedupeAnime(localMatches))
    }

    const requestId = ++requestIdRef.current
    searchTimeoutRef.current = setTimeout(async () => {
      let lastError: unknown = null
      let jikanResults: JikanAnime[] = []
      let paginationHasMore = false
      const candidates = buildSearchCandidates(normalizedQuery)
      let usedRemoteQuery = candidates[0] || normalizedQuery

      try {
        setLoading(true)
        setError('')

        for (const candidate of candidates) {
          try {
            const data = await searchAnime(candidate, 1, 5)
            if (requestIdRef.current !== requestId) return
            const fetched = data.data || []
            jikanResults = fetched
            paginationHasMore = data.pagination?.has_next_page || false
            usedRemoteQuery = candidate
            if (fetched.length > 0) break
          } catch (err) {
            lastError = err
          }
        }

        if (requestIdRef.current !== requestId) return

        const combined = dedupeAnime([...jikanResults, ...localMatches])
        if (combined.length === 0 && lastError) {
          setError('Не удалось выполнить поиск. Попробуйте позже.')
        } else {
          setError('')
        }
        setResults(combined)
        setHasMore(paginationHasMore && jikanResults.length > 0)
        setRemoteQuery(usedRemoteQuery)
        setCurrentPage(1)
        searchCacheRef.current.set(cacheKey, {
          results: combined,
          hasMore: paginationHasMore && jikanResults.length > 0,
          remoteQuery: usedRemoteQuery,
        })
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    }, 1200)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [query, mounted])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      const nextPage = currentPage + 1
      const effectiveQuery = remoteQuery || normalizeSearchQuery(query)
      if (!effectiveQuery) return
      const data = await searchAnime(effectiveQuery, nextPage, 20)
      setResults(prev => [...prev, ...(data.data || [])])
      setHasMore(data.pagination?.has_next_page || false)
      setCurrentPage(nextPage)
    } catch (err: any) {
      console.error('Error loading more results:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage, query, remoteQuery])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading, loadMore])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Cinematic Search Header */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[450px] h-[450px] bg-purple-500/8 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-purple-500/20">
                <Search className="h-5 w-5 text-purple-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Поиск{' '}
                <span className="text-primary">аниме</span>
              </h1>
            </div>
            <p className="text-foreground-secondary text-base max-w-xl mx-auto">
              Найди любой тайтл и добавь в свою коллекцию
            </p>
          </div>
        </div>
      </section>

      {/* Search Input */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-10">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/50" />
                <Input
                  type="text"
                  placeholder="Введите название аниме..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  className="pl-11 h-11 bg-background border-border text-base"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="max-w-2xl mx-auto mb-8 animate-fade-in">
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-xl text-center text-sm">
                {error}
              </div>
            </div>
          )}

          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-purple-500/10 blur-xl animate-pulse" />
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="animate-fade-in-up">
              <div className="anime-grid">
                {results.map((anime, index) => (
                  <div key={anime.mal_id} className={cn(
                    'animate-fade-in-up',
                    `stagger-${Math.min(index % 10 + 1, 10)}`
                  )}>
                    <JikanAnimeCard anime={anime} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    size="xl"
                    variant="outline"
                    className="group px-10 border-purple-500/15 hover:border-purple-500/30 hover:bg-purple-500/5 gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        Показать еще
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div ref={loadMoreRef} className="h-1" />
            </div>
          ) : query && query.length >= 2 ? (
            <div className="text-center py-32 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/5 mb-6 ring-1 ring-purple-500/10">
                <Search className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-foreground-secondary text-lg">
                Ничего не найдено. Попробуйте другой запрос.
              </p>
            </div>
          ) : (
            <div className="text-center py-32 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/5 mb-6 ring-1 ring-purple-500/10">
                <Compass className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-foreground-secondary text-lg">
                Введите название аниме для поиска
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
