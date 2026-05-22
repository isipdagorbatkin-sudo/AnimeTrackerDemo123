'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AniListAnimeCard } from '@/components/anime/AniListAnimeCard'
import { AnimeSortOption, AniListAnime, getAnimeByGenre } from '@/lib/anilist/client'
import { Loader2, ArrowLeft, Filter, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { translateGenre } from '@/lib/genres'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const sortOptions: { value: AnimeSortOption; label: string }[] = [
  { value: 'POPULARITY_DESC', label: 'По популярности' },
  { value: 'SCORE_DESC', label: 'По рейтингу' },
  { value: 'START_DATE_DESC', label: 'Сначала новые' },
  { value: 'START_DATE', label: 'Сначала старые' },
  { value: 'TITLE_ROMAJI', label: 'По названию' },
]

export default function GenrePage() {
  const params = useParams()
  const genre = decodeURIComponent(params.genre as string)
  const [animeList, setAnimeList] = useState<AniListAnime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [sortBy, setSortBy] = useState<AnimeSortOption>('POPULARITY_DESC')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadAnime = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getAnimeByGenre(genre, 1, 20, sortBy)
        setAnimeList(data.Page?.media || [])
        setHasMore(data.Page?.pageInfo?.hasNextPage || false)
        setCurrentPage(1)
      } catch (err: any) {
        console.error('Error loading anime by genre:', err)
        setError('Не удалось загрузить аниме по жанру. Попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [genre, mounted, sortBy])

  const loadMore = async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      const nextPage = currentPage + 1
      const data = await getAnimeByGenre(genre, nextPage, 20, sortBy)
      setAnimeList(prev => [...prev, ...(data.Page?.media || [])])
      setHasMore(data.Page?.pageInfo?.hasNextPage || false)
      setCurrentPage(nextPage)
    } catch (err: any) {
      console.error('Error loading more anime:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Вернуться на главную
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 shrink-0">
              <Filter className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
                {translateGenre(genre)}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                Аниме в жанре {translateGenre(genre)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto">
          <div className="mb-6 flex justify-end">
            <label className="relative h-11 w-full max-w-[240px]">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as AnimeSortOption)
                  setCurrentPage(1)
                }}
                className="h-11 w-full appearance-none rounded-xl border border-primary/25 bg-background/70 pl-9 pr-9 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                aria-label="Сортировка"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          </div>
          {loading && animeList.length === 0 ? (
            <div className="flex items-center justify-center py-32">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/20 mb-6">
                <span className="text-5xl">⚠️</span>
              </div>
              <p className="text-destructive text-xl mb-4">{error}</p>
            </div>
          ) : animeList.length === 0 ? (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6">
                <span className="text-5xl">🔍</span>
              </div>
              <p className="text-muted-foreground text-xl">
                Нет аниме в этом жанре
              </p>
            </div>
          ) : (
            <>
              <div className="anime-grid">
                {animeList.map((anime) => (
                  <AniListAnimeCard key={anime.id} anime={anime} />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-12"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      'Показать еще'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="border-t py-8 px-4 bg-muted">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 AnimeTracker. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}
