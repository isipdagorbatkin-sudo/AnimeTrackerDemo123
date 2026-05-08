'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { JikanAnimeCard } from '@/components/anime/JikanAnimeCard'
import { JikanAnime } from '@/lib/jikan/types'
import { searchAnime, getTopAnime, getAiringAnime, getUpcomingAnime, getCompletedAnime, getMovies, getAnimeByGenre } from '@/lib/jikan/client'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Filter, Sparkles, TrendingUp, Clock, Calendar, Film, CheckCircle, ChevronDown, Compass, Star, Eye } from 'lucide-react'
import { GenreFilterDialog } from '@/components/anime/GenreFilterDialog'
import { translateGenre } from '@/lib/genres'
import { cn } from '@/lib/utils'
import { searchLocalAnime, convertLocalToJikanArray } from '@/lib/local-anime/db'

type TabType = 'top' | 'airing' | 'upcoming' | 'completed' | 'movies'

function dedupeAnime(list: JikanAnime[]): JikanAnime[] {
  const seen = new Set<number>()
  return list.filter(a => {
    if (seen.has(a.mal_id)) return false
    seen.add(a.mal_id)
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
  const [activeTab, setActiveTab] = useState<TabType>('top')
  const [animeList, setAnimeList] = useState<JikanAnime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadAnime = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true)
      setError('')

      let data
      switch (activeTab) {
        case 'airing':
          data = await getAiringAnime(page, 20)
          break
        case 'upcoming':
          data = await getUpcomingAnime(page, 20)
          break
        case 'completed':
          data = await getCompletedAnime(page, 20)
          break
        case 'movies':
          data = await getMovies(page, 20)
          break
        case 'top':
        default:
          data = await getTopAnime(page, 20)
          break
      }

      const newAnime = dedupeAnime(data.data || [])
      setAnimeList(prev => append ? dedupeAnime([...prev, ...newAnime]) : newAnime)
      setHasMore(data.pagination?.has_next_page || false)
      setCurrentPage(page)
    } catch (err: any) {
      console.error('Error loading anime:', err)
      setError('Не удалось загрузить аниме. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (!mounted) return
    loadAnime(1, false)
  }, [activeTab, mounted])

  useEffect(() => {
    if (!mounted || !selectedGenre) return

    const loadAnimeByGenre = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getAnimeByGenre(selectedGenre, 1, 20)
        setAnimeList(dedupeAnime(data.data || []))
        setHasMore(data.pagination?.has_next_page || false)
        setCurrentPage(1)
      } catch (err: any) {
        console.error('Error loading anime by genre:', err)
        setError('Не удалось загрузить аниме по жанру.')
      } finally {
        setLoading(false)
      }
    }

    loadAnimeByGenre()
  }, [selectedGenre, mounted])

  useEffect(() => {
    if (!mounted) return

    clearTimeout(searchTimeoutRef.current)

    if (!searchQuery.trim() || searchQuery.length < 2) {
      if (selectedGenre) return
      setAnimeList([])
      setHasMore(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        setError('')

        const data = await searchAnime(searchQuery, 1, 5)
        const jikanResults = dedupeAnime(data.data || [])

        let combined = [...jikanResults]
        const hasCyrillic = /[а-яё]/i.test(searchQuery)
        if (hasCyrillic && jikanResults.length === 0) {
          const local = searchLocalAnime(searchQuery)
          if (local.length > 0) {
            combined = convertLocalToJikanArray(local)
          }
        }

        setAnimeList(combined)
        setHasMore(data.pagination?.has_next_page || false)
        setCurrentPage(1)
      } catch (err: any) {
        console.error('Search error:', err)
        setError('Не удалось выполнить поиск.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [searchQuery, mounted])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      const nextPage = currentPage + 1

      let data
      if (searchQuery) {
        data = await searchAnime(searchQuery, nextPage, 20)
      } else if (selectedGenre) {
        data = await getAnimeByGenre(selectedGenre, nextPage, 20)
      } else {
        switch (activeTab) {
          case 'airing':
            data = await getAiringAnime(nextPage, 20)
            break
          case 'upcoming':
            data = await getUpcomingAnime(nextPage, 20)
            break
          case 'completed':
            data = await getCompletedAnime(nextPage, 20)
            break
          case 'movies':
            data = await getMovies(nextPage, 20)
            break
          case 'top':
          default:
            data = await getTopAnime(nextPage, 20)
            break
        }
      }

      const newAnime = dedupeAnime(data.data || [])
      setAnimeList(prev => dedupeAnime([...prev, ...newAnime]))
      setHasMore(data.pagination?.has_next_page || false)
      setCurrentPage(nextPage)
    } catch (err: any) {
      console.error('Error loading more anime:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage, searchQuery, selectedGenre, activeTab])

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
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-xl shadow-purple-500/20 animate-pulse-glow">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ─── Cinematic Hero Section ─── */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-3xl animate-aurora" />
          <div className="absolute top-10 -right-40 w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '-7s' }} />
          <div className="absolute -bottom-40 left-1/4 w-[350px] h-[350px] bg-cyan-500/4 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '-14s' }} />
          <div className="absolute top-1/3 left-1/2 w-[200px] h-[200px] bg-pink-500/3 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-purple-500/20">
                  <Compass className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-[0.6rem] font-semibold tracking-[0.15em] uppercase text-purple-400/60">
                  Исследуй аниме
                </span>
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                  Твой{' '}
                  <span className="text-gradient-glow">мир аниме</span>
                </h1>
                <p className="text-foreground-secondary text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
                  Открой тысячи тайтлов, отслеживай прогресс и управляй коллекцией в премиальном пространстве
                </p>
              </div>
            </div>

            {/* Cinematic Stats */}
            <div className="flex items-center gap-3 shrink-0 animate-fade-in-up stagger-3">
              <div className="glass-card !rounded-xl !p-3.5 min-w-[110px]">
                <div className="flex items-center gap-2 text-purple-400 mb-1.5">
                  <Star className="h-3.5 w-3.5" />
                  <span className="text-[0.55rem] font-semibold tracking-wider uppercase text-muted-foreground">
                    Топ рейтинг
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-gradient-primary">#1</p>
              </div>
              <div className="glass-card !rounded-xl !p-3.5 min-w-[110px]">
                <div className="flex items-center gap-2 text-cyan-400 mb-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="text-[0.55rem] font-semibold tracking-wider uppercase text-muted-foreground">
                    Смотрю
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight text-gradient-cyan">12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Premium Search Bar ─── */}
      <section className="px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-4 sm:p-5 animate-fade-in-up stagger-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  type="text"
                  placeholder="Поиск аниме по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white/[0.015] border-border/30 focus-visible:bg-white/[0.03] text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsGenreDialogOpen(true)}
                  className={cn(
                    "h-10 gap-2 border-border/30 hover:border-purple-500/30 text-sm",
                    selectedGenre && "border-purple-500/25 bg-purple-500/5 text-purple-300"
                  )}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedGenre ? translateGenre(selectedGenre) : 'Жанры'}</span>
                </Button>
                {selectedGenre && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setSelectedGenre('')
                      setSearchQuery('')
                    }}
                    className="h-10 gap-2 border-purple-500/25 bg-purple-500/5 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/35"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Content ─── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as TabType)
            setSelectedGenre('')
            setSearchQuery('')
            setCurrentPage(1)
          }} className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex mb-8 bg-white/[0.02] ring-1 ring-white/[0.04] p-1 rounded-xl">
              {tabConfig.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.value
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'data-active:bg-gradient-to-b data-active:from-purple-500/12 data-active:to-purple-500/5 data-active:text-foreground data-active:ring-1 data-active:ring-purple-500/12 rounded-lg text-xs sm:text-sm h-9 gap-1.5',
                      'data-active:shadow-sm data-active:shadow-purple-500/5'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', isActive && 'text-purple-400')} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {loading && animeList.length === 0 ? (
              <div className="flex items-center justify-center py-32">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-purple-500/10 blur-xl animate-pulse" />
                </div>
              </div>
            ) : error ? (
              <div className="empty-state py-32">
                <div className="empty-state-icon">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-destructive text-lg font-medium mb-1">{error}</p>
                <p className="text-muted-foreground/70 text-sm">Проверьте подключение и попробуйте снова</p>
              </div>
            ) : animeList.length === 0 ? (
              <div className="empty-state py-32">
                <div className="empty-state-icon">
                  <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {searchQuery ? 'Ничего не найдено' : 'Пока пусто'}
                </h3>
                <p className="text-muted-foreground/70 text-sm max-w-sm">
                  {searchQuery
                    ? 'Попробуйте изменить поисковый запрос'
                    : 'В этой категории пока нет аниме'}
                </p>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <div className="anime-grid">
                  {animeList.map((anime, index) => (
                    <div key={anime.mal_id} className={cn(
                      'animate-fade-in-up',
                      `stagger-${Math.min(index % 10 + 1, 10)}`
                    )}>
                      <JikanAnimeCard anime={anime} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-12 animate-fade-in-up">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      size="xl"
                      variant="outline"
                      className="group px-10 border-purple-500/15 hover:border-purple-500/30 hover:bg-purple-500/5 gap-3 transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          Показать ещё
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
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

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-gradient-primary">AnimeTracker</span>
          </div>
          <p className="text-xs text-muted-foreground/40">
            © 2024 AnimeTracker. Все права защищены.
          </p>
        </div>
      </footer>

      <GenreFilterDialog
        isOpen={isGenreDialogOpen}
        onClose={() => setIsGenreDialogOpen(false)}
        selectedGenre={selectedGenre}
        onGenreSelect={(genre) => {
          setSelectedGenre(genre)
          setSearchQuery('')
        }}
      />
    </div>
  )
}
