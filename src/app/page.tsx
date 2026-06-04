'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ShikimoriAnimeCard } from '@/components/anime/ShikimoriAnimeCard'
import { ShikimoriAnime, searchAnime, getTopAnime, getAiringAnime, getUpcomingAnime, getReleasedAnime, getMovies, getAnimeByGenre } from '@/lib/shikimori/client'
import { getShikimoriGenreId } from '@/lib/shikimori/genres'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Filter, TrendingUp, Clock, Calendar, Film, CheckCircle, ChevronDown, Star, Eye } from 'lucide-react'
import { GenreFilterDialog } from '@/components/anime/GenreFilterDialog'
import { translateGenre } from '@/lib/genres'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type TabType = 'top' | 'airing' | 'upcoming' | 'completed' | 'movies'

function dedupeAnime(list: ShikimoriAnime[]): ShikimoriAnime[] {
  const seen = new Set<number>()
  return list.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
}

const tabConfig = [
  { value: 'top' as TabType, label: 'Топ', icon: TrendingUp },
  { value: 'airing' as TabType, label: 'Онгоинги', icon: Clock },
  { value: 'upcoming' as TabType, label: 'Анонсы', icon: Calendar },
  { value: 'completed' as TabType, label: 'Завершённые', icon: CheckCircle },
  { value: 'movies' as TabType, label: 'Фильмы', icon: Film },
]

export default function HomePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('top')
  const [animeList, setAnimeList] = useState<ShikimoriAnime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [remoteSearchQuery, setRemoteSearchQuery] = useState('')
  const [collectionIds, setCollectionIds] = useState<Set<number>>(new Set())

  const genreLoaderRef = useRef<() => Promise<void>>()

  const refreshCollection = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('anime_collection')
      .select('anime_id')
      .eq('user_id', user.id)
    if (data) setCollectionIds(new Set(data.map(i => i.anime_id)))
  }, [])

  const loadAnime = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true)
      setError('')
      let results: ShikimoriAnime[]
      switch (activeTab) {
        case 'airing': results = await getAiringAnime(page, 20); break
        case 'upcoming': results = await getUpcomingAnime(page, 20); break
        case 'completed': results = await getReleasedAnime(page, 20); break
        case 'movies': results = await getMovies(page, 20); break
        case 'top': default: results = await getTopAnime(page, 20); break
      }
      const newAnime = dedupeAnime(results || [])
      setAnimeList(prev => append ? dedupeAnime([...prev, ...newAnime]) : newAnime)
      setHasMore(results.length >= 20)
      setCurrentPage(page)
    } catch (err: any) {
      console.error('Error loading anime:', err)
      setError('Не удалось загрузить аниме. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchCacheRef = useRef(new Map<string, { results: ShikimoriAnime[]; hasMore: boolean; remoteQuery: string }>())
  const requestIdRef = useRef(0)
  const loadAnimeRef = useRef(loadAnime)

  useEffect(() => { loadAnimeRef.current = loadAnime }, [loadAnime])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('anime_collection')
        .select('anime_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setCollectionIds(new Set(data.map(i => i.anime_id)))
        })
    })
  }, [])

  useEffect(() => {
    loadAnime(1, false)
  }, [activeTab])

  useEffect(() => {
    if (!selectedGenre) return
    const loadAnimeByGenre = async () => {
      try {
        setLoading(true)
        setError('')
        const genreId = await getShikimoriGenreId(selectedGenre)
        const results = await getAnimeByGenre(String(genreId), 1, 20)
        setAnimeList(dedupeAnime(results || []))
        setHasMore(results.length >= 20)
        setCurrentPage(1)
      } catch (err: any) {
        console.error('Error loading anime by genre:', err)
        setError('Не удалось загрузить аниме по жанру.')
      } finally {
        setLoading(false)
      }
    }
    genreLoaderRef.current = loadAnimeByGenre
    loadAnimeByGenre()
  }, [selectedGenre])

  useEffect(() => {
    clearTimeout(searchTimeoutRef.current)
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery || normalizedQuery.length < 2) {
      if (selectedGenre) {
        genreLoaderRef.current?.()
        return
      }
      if (normalizedQuery.length === 0) {
        loadAnimeRef.current(1, false)
        return
      }
      setAnimeList([])
      setHasMore(false)
      setRemoteSearchQuery('')
      return
    }

    const cacheKey = normalizedQuery
    const cached = searchCacheRef.current.get(cacheKey)
    if (cached) {
      setAnimeList(cached.results)
      setHasMore(cached.hasMore)
      setRemoteSearchQuery(cached.remoteQuery)
      setCurrentPage(1)
      return
    }

    const requestId = ++requestIdRef.current
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        setError('')

        const results = await searchAnime(normalizedQuery, 1, 20)

        if (requestIdRef.current !== requestId) return

        const deduped = dedupeAnime(results || [])
        setAnimeList(deduped)
        const searchHasMore = results.length >= 20
        setHasMore(searchHasMore)
        setRemoteSearchQuery(normalizedQuery)
        setCurrentPage(1)

        searchCacheRef.current.set(cacheKey, {
          results: deduped,
          hasMore: searchHasMore,
          remoteQuery: normalizedQuery,
        })
      } catch (err: any) {
        if (requestIdRef.current === requestId) {
          console.error('Error searching anime:', err)
          setError('Не удалось выполнить поиск.')
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    }, 400)
    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery, selectedGenre])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    try {
      setLoading(true)
      const nextPage = currentPage + 1
      let results: ShikimoriAnime[]
      if (searchQuery) {
        const effectiveQuery = remoteSearchQuery || searchQuery.trim().toLowerCase()
        if (!effectiveQuery) return
        results = await searchAnime(effectiveQuery, nextPage, 20)
      }
      else if (selectedGenre) {
        const genreId = await getShikimoriGenreId(selectedGenre)
        results = await getAnimeByGenre(String(genreId), nextPage, 20)
      }
      else {
        switch (activeTab) {
          case 'airing': results = await getAiringAnime(nextPage, 20); break
          case 'upcoming': results = await getUpcomingAnime(nextPage, 20); break
          case 'completed': results = await getReleasedAnime(nextPage, 20); break
          case 'movies': results = await getMovies(nextPage, 20); break
          case 'top': default: results = await getTopAnime(nextPage, 20); break
        }
      }
      const newAnime = dedupeAnime(results || [])
      setAnimeList(prev => dedupeAnime([...prev, ...newAnime]))
      setHasMore(results.length >= 20)
      setCurrentPage(nextPage)
    } catch (err: any) {
      console.error('Error loading more anime:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage, searchQuery, remoteSearchQuery, selectedGenre, activeTab])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-36 -right-40 h-[480px] w-[480px] rounded-full bg-purple-500/15 blur-[120px]" />
          <div className="absolute -bottom-40 -left-32 h-[360px] w-[360px] rounded-full bg-cyan-400/10 blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_45%)]" />
        </div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
            <div className="max-w-2xl">
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
                Твой личный{' '}
                <span className="text-primary">аниме-центр</span>
              </h1>
              <p className="text-foreground-secondary text-base sm:text-lg mt-4 leading-relaxed">
                Отслеживай просмотр, собирай коллекцию и находи друзей.
              </p>
              <div className="flex items-center gap-3 mt-7">
                <Button size="lg" className="gap-2 shadow-[0_18px_40px_rgba(168,85,247,0.3)]">
                  <Star className="h-4 w-4" />
                  Начать просмотр
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5" onClick={() => router.push('/collection')}>
                  <Eye className="h-4 w-4" />
                  Моя коллекция
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="glass rounded-2xl p-4 min-w-[110px]">
                <div className="text-[0.55rem] font-semibold tracking-wider uppercase text-foreground-secondary mb-1">
                  Топ рейтинг
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span className="text-2xl font-bold text-primary">#1</span>
                </div>
              </div>
              <div className="glass rounded-2xl p-4 min-w-[110px]">
                <div className="text-[0.55rem] font-semibold tracking-wider uppercase text-foreground-secondary mb-1">
                  Смотрю
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-2xl font-bold text-cyan-400">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Поиск аниме по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-background/60 border-border/70 text-sm focus-visible:ring-primary/40"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsGenreDialogOpen(true)}
                  className={cn(
                    'h-11 gap-2 text-sm border-primary/25 hover:border-primary/50 hover:bg-primary/5',
                    selectedGenre && "border-primary/30 bg-primary/5 text-primary"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedGenre ? translateGenre(selectedGenre) : 'Жанры'}</span>
                </Button>
                {selectedGenre && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => { setSelectedGenre(''); setSearchQuery('') }}
                    className="h-11 border-primary/20 hover:border-primary/40"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as TabType)
            setSelectedGenre('')
            setSearchQuery('')
            setCurrentPage(1)
          }} className="w-full">
            <TabsList className="w-full sm:w-auto inline-flex gap-1 mb-6 bg-card/70 border border-border/70 p-1.5 rounded-2xl backdrop-blur">
              {tabConfig.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'data-active:bg-primary data-active:text-primary-foreground rounded-xl text-xs sm:text-sm h-8 gap-1.5 px-3',
                      'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {loading && animeList.length === 0 ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="empty-state py-32">
                <div className="empty-state-icon">
                  <span className="text-xl">⚠️</span>
                </div>
                <p className="text-destructive text-base font-medium mb-1">{error}</p>
                <p className="text-muted-foreground text-sm">Проверьте подключение и попробуйте снова</p>
              </div>
            ) : animeList.length === 0 ? (
              <div className="empty-state py-32">
                <div className="empty-state-icon">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">
                  {searchQuery ? 'Ничего не найдено' : 'Пока пусто'}
                </h3>
                <p className="text-muted-foreground text-sm max-w-sm">
                  {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'В этой категории пока нет аниме'}
                </p>
              </div>
            ) : (
              <div>
                <div className="anime-grid">
                  {animeList.map((anime) => (
                    <ShikimoriAnimeCard key={anime.id} anime={anime} isInCollection={collectionIds.has(anime.id)} onAddToCollection={refreshCollection} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      size="lg"
                      variant="outline"
                      className="gap-2 px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          Показать ещё
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <div ref={loadMoreRef} className="h-2" />
              </div>
            )}
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FlameIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AnimeTracker</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2024 AnimeTracker. Все права защищены.
          </p>
        </div>
      </footer>

      <GenreFilterDialog
        isOpen={isGenreDialogOpen}
        onClose={() => setIsGenreDialogOpen(false)}
        selectedGenre={selectedGenre}
        onGenreSelect={(genre) => { setSelectedGenre(genre); setSearchQuery('') }}
      />
    </div>
  )
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.866 3.5-8 7-12 3.5 4 7 8.134 7 12 0 3.866-3.134 7-7 7z" />
    </svg>
  )
}
