'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AniListAnimeCard } from '@/components/anime/AniListAnimeCard'
import {
  AniListAnime,
  AniListSearchResponse,
  AnimeSortOption,
  searchAnime,
  getTopAnime,
  getAiringAnime,
  getUpcomingAnime,
  getCompletedAnime,
  getMovies,
  getAnimeByGenre,
  getAnimeById,
  getRandomAnime,
  getCoverImage,
} from '@/lib/anilist/client'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Loader2, Search, Filter, TrendingUp, Clock, Calendar, Film, CheckCircle, ChevronDown, Star, Eye, GamepadIcon, HelpCircle, Send, FileText, Images, RotateCcw, CheckCircle2, XCircle, SlidersHorizontal, Sparkles } from 'lucide-react'
import { GenreFilterDialog } from '@/components/anime/GenreFilterDialog'
import { translateGenre } from '@/lib/genres'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { searchWithRussian } from '@/lib/search'
import { motion } from 'framer-motion'
import { useRussianText, fetchRussianText, getRussianText } from '@/lib/russian-cache'
import { cleanAnimeDescription } from '@/lib/anime-text'
import { GuestBanner } from '@/components/auth/GuestBanner'

type TabType = 'airing' | 'recommendations' | 'top' | 'upcoming' | 'completed' | 'movies' | 'guess'
type GuessMode = 'description' | 'frames'

type CollectionSignal = {
  anime_id: number
  status?: string | null
  rating?: number | null
}

const sortOptions: { value: AnimeSortOption; label: string }[] = [
  { value: 'POPULARITY_DESC', label: 'По популярности' },
  { value: 'SCORE_DESC', label: 'По рейтингу' },
  { value: 'START_DATE_DESC', label: 'Сначала новые' },
  { value: 'START_DATE', label: 'Сначала старые' },
  { value: 'TITLE_ROMAJI', label: 'По названию' },
]

function sortAnimeLocally(list: AniListAnime[], sort: AnimeSortOption): AniListAnime[] {
  const score = (anime: AniListAnime) => anime.meanScore || anime.averageScore || 0
  const dateValue = (anime: AniListAnime) => {
    const year = anime.startDate?.year || anime.seasonYear || 0
    const month = anime.startDate?.month || 0
    const day = anime.startDate?.day || 0
    return year * 10000 + month * 100 + day
  }
  const title = (anime: AniListAnime) => anime.title?.romaji || anime.title?.english || anime.title?.native || ''

  return [...list].sort((a, b) => {
    if (sort === 'SCORE_DESC') return score(b) - score(a)
    if (sort === 'START_DATE_DESC') return dateValue(b) - dateValue(a)
    if (sort === 'START_DATE') return dateValue(a) - dateValue(b)
    if (sort === 'TITLE_ROMAJI') return title(a).localeCompare(title(b))
    return 0
  })
}

function dedupeAnime(list: AniListAnime[]): AniListAnime[] {
  const seen = new Set<number>()
  return list.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
}

function stripHtml(value: string | null): string {
  return cleanAnimeDescription(value).replace(/\s+/g, ' ').trim()
}

function collectionSignalWeight(item: CollectionSignal): number {
  const normalizedRating = item.rating ? Math.min(10, Math.max(0, item.rating)) : 0
  const ratingWeight = normalizedRating ? normalizedRating * 0.75 : 1.5
  const statusWeight: Record<string, number> = {
    completed: 4,
    watching: 3,
    plan_to_watch: 1,
    on_hold: 0.5,
    dropped: -3,
  }

  return ratingWeight + (statusWeight[item.status || ''] || 0)
}

function scoreRecommendation(anime: AniListAnime, genreWeights: Map<string, number>): number {
  const genreScore = (anime.genres || []).reduce((sum, genre) => sum + (genreWeights.get(genre) || 0), 0)
  const score = anime.meanScore || anime.averageScore || 0
  const popularity = anime.popularity || 0
  const recency = anime.seasonYear ? Math.max(0, anime.seasonYear - 1990) * 0.12 : 0

  return genreScore * 2.7 + score * 0.45 + Math.log10(popularity + 10) * 7 + recency
}

async function fetchAnimeFrames(anime: AniListAnime): Promise<string[]> {
  const title = anime.title?.romaji || anime.title?.english || anime.title?.native || ''
  if (!title) return []

  const params = new URLSearchParams({ q: title })
  for (const fallback of [anime.title?.english, anime.title?.native].filter(Boolean) as string[]) {
    if (fallback !== title) params.append('fallback', fallback)
  }
  if (anime.idMal) params.set('idMal', String(anime.idMal))
  if (anime.startDate?.year || anime.seasonYear) params.set('year', String(anime.startDate?.year || anime.seasonYear))
  if (anime.episodes) params.set('episodes', String(anime.episodes))

  try {
    const res = await fetch(`/api/kodik/search?${params.toString()}`)
    const data = await res.json()
    const frames = (data.results || []).flatMap((result: { screenshots?: string[] }) => result.screenshots || [])
    return [...new Set(frames)].filter(Boolean).slice(0, 4) as string[]
  } catch {
    return []
  }
}

const tabConfig = [
  { value: 'airing' as TabType, label: 'Сейчас популярно', icon: Clock },
  { value: 'recommendations' as TabType, label: 'Рекомендации', icon: Sparkles },
  { value: 'top' as TabType, label: 'Топ', icon: TrendingUp },
  { value: 'upcoming' as TabType, label: 'Анонсы', icon: Calendar },
  { value: 'completed' as TabType, label: 'Завершённые', icon: CheckCircle },
  { value: 'movies' as TabType, label: 'Фильмы', icon: Film },
  { value: 'guess' as TabType, label: 'Угадай аниме', icon: GamepadIcon },
]

export default function HomePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('airing')
  const [animeList, setAnimeList] = useState<AniListAnime[]>([])
  const [heroAnimeList, setHeroAnimeList] = useState<AniListAnime[]>([])
  const [heroRussianTitles, setHeroRussianTitles] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<AnimeSortOption>('POPULARITY_DESC')
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [remoteSearchQuery, setRemoteSearchQuery] = useState('')
  const [collectionIds, setCollectionIds] = useState<Set<number>>(new Set())
  const [collectionItems, setCollectionItems] = useState<CollectionSignal[]>([])

  const genreLoaderRef = useRef<() => Promise<void>>()

  const [guessAnime, setGuessAnime] = useState<AniListAnime | null>(null)
  const [guessFrames, setGuessFrames] = useState<string[]>([])
  const [guessMode, setGuessMode] = useState<GuessMode>('description')
  const [guessStep, setGuessStep] = useState<'loading' | 'ready' | 'result'>('loading')
  const [guessInput, setGuessInput] = useState('')
  const [guessMessage, setGuessMessage] = useState('')
  const [usedHints, setUsedHints] = useState(0)
  const [guessScore, setGuessScore] = useState(0)
  const [guessSearchResults, setGuessSearchResults] = useState<AniListAnime[]>([])
  const [guessSearching, setGuessSearching] = useState(false)
  const [guessStreak, setGuessStreak] = useState(0)
  const guessSearchTimeoutRef = useRef<NodeJS.Timeout>()
  const guessRussianText = useRussianText(guessAnime)

  const refreshCollection = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('anime_collection')
      .select('anime_id,status,rating')
      .eq('user_id', user.id)
      .eq('source', 'anilist')
    if (data) {
      setCollectionIds(new Set(data.map(i => i.anime_id)))
      setCollectionItems(data as CollectionSignal[])
    }
  }, [])

  const loadRecommendations = useCallback(async (page: number = 1, perPage: number = 20): Promise<AniListSearchResponse> => {
    if (collectionItems.length === 0) {
      return getAiringAnime(page, perPage, 'POPULARITY_DESC')
    }

    const weightedItems = [...collectionItems]
      .map((item) => ({ ...item, weight: collectionSignalWeight(item) }))
      .filter((item) => item.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 22)

    if (weightedItems.length === 0) {
      return getTopAnime(page, perPage, 'POPULARITY_DESC')
    }

    const details = await Promise.all(
      weightedItems.map(async (item) => {
        try {
          const anime = await getAnimeById(item.anime_id)
          return anime ? { anime, weight: item.weight } : null
        } catch {
          return null
        }
      })
    )

    const genreWeights = new Map<string, number>()
    for (const detail of details) {
      if (!detail) continue
      for (const genre of detail.anime.genres || []) {
        genreWeights.set(genre, (genreWeights.get(genre) || 0) + detail.weight)
      }
    }

    const topGenres = [...genreWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([genre]) => genre)

    const batches = await Promise.all([
      getTopAnime(page, perPage, 'POPULARITY_DESC').catch(() => null),
      getTopAnime(page, perPage, 'SCORE_DESC').catch(() => null),
      ...topGenres.map((genre) => getAnimeByGenre(genre, page, perPage, 'POPULARITY_DESC').catch(() => null)),
    ])

    const candidates = dedupeAnime(
      batches.flatMap((result) => result?.Page?.media || [])
    )
      .filter((anime) => !collectionIds.has(anime.id))
      .filter((anime) => (anime.averageScore || anime.meanScore || 0) >= 62 || (anime.popularity || 0) >= 12000)
      .sort((a, b) => scoreRecommendation(b, genreWeights) - scoreRecommendation(a, genreWeights))
      .slice(0, perPage)

    return {
      Page: {
        media: candidates,
        pageInfo: {
          total: candidates.length,
          perPage,
          currentPage: page,
          lastPage: page + (candidates.length >= perPage ? 1 : 0),
          hasNextPage: candidates.length >= perPage,
        },
      },
    }
  }, [collectionIds, collectionItems])

  const loadAnime = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true)
      setError('')
      let results: AniListSearchResponse
      switch (activeTab) {
        case 'airing': results = await getAiringAnime(page, 20, sortBy); break
        case 'recommendations': results = await loadRecommendations(page, 20); break
        case 'upcoming': results = await getUpcomingAnime(page, 20, sortBy); break
        case 'completed': results = await getCompletedAnime(page, 20, sortBy); break
        case 'movies': results = await getMovies(page, 20, sortBy); break
        case 'top': default: results = await getTopAnime(page, 20, sortBy); break
      }
      const newAnime = dedupeAnime(results.Page?.media || [])
      setAnimeList(prev => append ? dedupeAnime([...prev, ...newAnime]) : newAnime)
      setHasMore(results.Page?.pageInfo?.hasNextPage || false)
      setCurrentPage(page)
    } catch (err: any) {
      console.error('Error loading anime:', err)
      setError('Не удалось загрузить аниме. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, loadRecommendations, sortBy])

  const startGuessGame = useCallback(async (mode: GuessMode = guessMode) => {
    setGuessStep('loading')
    setGuessInput('')
    setGuessMessage('')
    setGuessSearchResults([])
    setGuessFrames([])
    setUsedHints(0)
    try {
      let anime: AniListAnime | null = null
      let fallbackAnime: AniListAnime | null = null
      let frames: string[] = []
      let attempts = 0

      while (attempts < 8) {
        attempts += 1
        const candidate = await getRandomAnime()
        if (!candidate) continue
        fallbackAnime ||= candidate

        if (mode === 'description') {
          if (stripHtml(candidate.description).length > 40) {
            anime = candidate
            break
          }
        } else {
          const loadedFrames = await fetchAnimeFrames(candidate)
          if (loadedFrames.length > 0) {
            anime = candidate
            frames = loadedFrames
            break
          }
        }
      }

      if (!anime && mode === 'description') {
        anime = fallbackAnime
      }

      if (!anime && mode === 'frames') {
        anime = fallbackAnime
      }

      if (!anime) {
        setGuessMessage('Не удалось подобрать раунд. Попробуйте снова.')
        setGuessStep('ready')
        return
      }
      setGuessAnime(anime)
      setGuessFrames(frames)
      setGuessStep('ready')
    } catch {
      setGuessMessage('Ошибка загрузки. Попробуйте снова.')
      setGuessStep('ready')
    }
  }, [guessMode])

  useEffect(() => {
    if (activeTab === 'guess') {
      startGuessGame(guessMode)
    } else {
      loadAnime(1, false)
    }
  }, [activeTab, guessMode])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getAiringAnime(1, 20, 'POPULARITY_DESC').catch(() => null),
      getAiringAnime(2, 20, 'POPULARITY_DESC').catch(() => null),
    ])
      .then(async (results) => {
        if (cancelled) return
        const all = results.flatMap(r => r?.Page?.media || [])
        const unique = dedupeAnime(all)
        setHeroAnimeList(unique)
        const titleMap: Record<number, string> = {}
        await Promise.all(unique.map(async (anime) => {
          if (anime.idMal) {
            await fetchRussianText(anime.idMal, anime.title?.english, anime.title?.romaji, anime.title?.native)
            const ru = getRussianText(anime.idMal)
            if (ru?.title) titleMap[anime.id] = ru.title
          }
        }))
        if (!cancelled) setHeroRussianTitles(titleMap)
      })
      .catch(() => {
        if (!cancelled) setHeroAnimeList([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchCacheRef = useRef(new Map<string, { results: AniListAnime[]; hasMore: boolean; remoteQuery: string }>())
  const requestIdRef = useRef(0)
  const loadAnimeRef = useRef(loadAnime)

  useEffect(() => { loadAnimeRef.current = loadAnime }, [loadAnime])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('anime_collection')
        .select('anime_id,status,rating')
        .eq('user_id', user.id)
        .eq('source', 'anilist')
        .then(({ data }) => {
          if (data) {
            setCollectionIds(new Set(data.map(i => i.anime_id)))
            setCollectionItems(data as CollectionSignal[])
          }
        })
    })
  }, [])

  useEffect(() => {
    if (!selectedGenre || activeTab === 'guess') return
    const loadAnimeByGenre = async () => {
      try {
        setLoading(true)
        setError('')
        const results = await getAnimeByGenre(selectedGenre, 1, 20, sortBy)
        setAnimeList(dedupeAnime(results.Page?.media || []))
        setHasMore(results.Page?.pageInfo?.hasNextPage || false)
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
  }, [selectedGenre, activeTab, sortBy])

  useEffect(() => {
    clearTimeout(guessSearchTimeoutRef.current)
    const query = guessInput.trim()

    if (activeTab !== 'guess' || guessStep !== 'ready' || query.length < 2) {
      setGuessSearchResults([])
      setGuessSearching(false)
      return
    }

    guessSearchTimeoutRef.current = setTimeout(async () => {
      try {
        setGuessSearching(true)
        const result = await searchWithRussian(query, 1, 5)
        setGuessSearchResults(result.media || [])
      } catch {
        setGuessSearchResults([])
      } finally {
        setGuessSearching(false)
      }
    }, 260)

    return () => clearTimeout(guessSearchTimeoutRef.current)
  }, [activeTab, guessInput, guessStep])

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

    const cacheKey = `${normalizedQuery}:${sortBy}`
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

        const result = await searchWithRussian(normalizedQuery, 1, 20)
        if (requestIdRef.current !== requestId) return

        setAnimeList(sortAnimeLocally(result.media, sortBy))
        setHasMore(result.hasMore)
        setRemoteSearchQuery(normalizedQuery)
        setCurrentPage(1)

        searchCacheRef.current.set(cacheKey, {
          results: sortAnimeLocally(result.media, sortBy),
          hasMore: result.hasMore,
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
  }, [searchQuery, selectedGenre, sortBy])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || activeTab === 'guess') return
    try {
      setLoading(true)
      const nextPage = currentPage + 1
      let results: AniListAnime[]
      if (searchQuery) {
        const effectiveQuery = remoteSearchQuery || searchQuery.trim().toLowerCase()
        if (!effectiveQuery) return
        const result = await searchWithRussian(effectiveQuery, nextPage, 20)
        results = sortAnimeLocally(result.media || [], sortBy)
        setHasMore(result.hasMore)
      }
      else if (selectedGenre) {
        const result = await getAnimeByGenre(selectedGenre, nextPage, 20, sortBy)
        results = result.Page?.media || []
      }
      else {
        let result: AniListSearchResponse
        switch (activeTab) {
          case 'airing': result = await getAiringAnime(nextPage, 20, sortBy); break
          case 'recommendations': result = await loadRecommendations(nextPage, 20); break
          case 'upcoming': result = await getUpcomingAnime(nextPage, 20, sortBy); break
          case 'completed': result = await getCompletedAnime(nextPage, 20, sortBy); break
          case 'movies': result = await getMovies(nextPage, 20, sortBy); break
          case 'top': default: result = await getTopAnime(nextPage, 20, sortBy); break
        }
        results = result.Page?.media || []
      }
      const newAnime = dedupeAnime(results || [])
      setAnimeList(prev => dedupeAnime([...prev, ...newAnime]))
      if (!searchQuery) setHasMore(results.length >= 20)
      setCurrentPage(nextPage)
    } catch (err: any) {
      console.error('Error loading more anime:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentPage, searchQuery, remoteSearchQuery, selectedGenre, activeTab, sortBy, loadRecommendations])

  useEffect(() => {
    if (activeTab === 'guess') return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) loadMore()
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore, activeTab])

  const isCorrectGuess = (value: string, anime: AniListAnime): boolean => {
    const guess = normalizeTitle(value)
    if (!guess) return false
    const titles = [
      anime.title.romaji,
      anime.title.english || '',
      anime.title.native || '',
      guessRussianText.title || '',
    ].map(normalizeTitle).filter(Boolean)
    return titles.some(title => title === guess || title.includes(guess) && guess.length > 5)
  }

  const handleGuess = (selectedAnime?: AniListAnime) => {
    if (!guessAnime) return
    const guessedValue = selectedAnime
      ? selectedAnime.title.romaji || selectedAnime.title.english || selectedAnime.title.native || ''
      : guessInput

    if ((selectedAnime && selectedAnime.id === guessAnime.id) || isCorrectGuess(guessedValue, guessAnime)) {
      const points = Math.max(10 - usedHints * 2, 1)
      setGuessScore(s => s + points)
      setGuessStreak(s => s + 1)
      setGuessMessage(`Правильно. +${points} очков`)
      setGuessStep('result')
    } else {
      setGuessStreak(0)
      setGuessMessage('Не оно. Попробуйте другой тайтл.')
    }
  }

  const handleHint = () => {
    if (!guessAnime) return
    setUsedHints(s => s + 1)
    const hints = [
      () => `Подсказка: ${guessAnime.genres?.slice(0, 3).join(', ')}`,
      () => `Подсказка: ${guessAnime.startDate?.year ? 'Год: ' + guessAnime.startDate.year : ''}`,
      () => `Подсказка: Начинается на "${(guessAnime.title.romaji || '')[0]}"`,
    ]
    setGuessMessage(hints[Math.min(usedHints, hints.length - 1)]())
  }

  const handleSkip = () => {
    if (!guessAnime) return
    const title = guessRussianText.title || guessAnime.title.romaji || guessAnime.title.english || guessAnime.title.native
    setGuessStreak(0)
    setGuessMessage(`Это было: ${title}`)
    setGuessStep('result')
  }

  const heroAnime = (heroAnimeList.length ? heroAnimeList : animeList).slice(0, 28)
  const heroLeft = heroAnime.slice(0, 14)
  const heroRight = heroAnime.slice(14, 28)
  const renderHeroRail = (items: AniListAnime[], direction: 'up' | 'down') => {
    const loopItems = items.length > 0 ? [...items, ...items] : []
    return (
      <div className="hero-anime-mask">
        <div className={cn('hero-anime-rail', direction === 'down' && 'hero-anime-rail-down')}>
          {loopItems.map((anime, index) => {
            const image = getProxiedImageUrl(getCoverImage(anime))
            const heroTitle = heroRussianTitles[anime.id] || anime.title?.romaji || anime.title?.english || anime.title?.native || ''
            return (
              <Link
                key={`${direction}-${anime.id}-${index}`}
                href={`/anime/${anime.id}`}
                className="hero-anime-card group"
              >
                {image && <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/82" />
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 text-sm font-bold leading-tight text-white drop-shadow">
                  {heroTitle}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="font-[var(--font-display)]">
      <section className="relative min-h-[calc(100svh-3rem)] overflow-hidden px-4 pb-8 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="anime-wordmark absolute -top-28 left-1/2 w-max -translate-x-1/2 text-[20vw] font-bold leading-none">
            Anime Anime Anime
          </div>
          <div className="anime-wordmark absolute top-[42%] left-1/2 w-max -translate-x-1/2 -translate-y-1/2 text-[22vw] font-bold leading-none">
            AnimeTracker
          </div>
          <div className="anime-wordmark absolute -bottom-24 left-1/2 w-max -translate-x-1/2 text-[19vw] font-bold leading-none">
            Collection
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[calc(100svh-6rem)] max-w-7xl items-center justify-center">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_430px]">
            <motion.div
              className="mx-auto max-w-3xl lg:mx-0 lg:pl-12"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl font-bold leading-none tracking-tight text-white drop-shadow-xl sm:text-7xl">
                AnimeTracker
              </h1>
              <p className="mt-8 max-w-2xl text-base font-bold leading-relaxed tracking-wide text-white/85 sm:text-lg">
                Смотри, собирай и открывай аниме в личной медиатеке без лишней оболочки: тёмный интерфейс, быстрый каталог и твоя коллекция под рукой.
              </p>
              <div className="flex items-center gap-3 mt-7">
                <Button size="lg" className="gap-2 rounded-sm bg-primary shadow-[0_18px_40px_rgba(239,68,68,0.24)] hover:bg-red-500" onClick={() => document.getElementById('anime-catalog')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Star className="h-4 w-4" />
                  Открыть каталог
                </Button>
                <Button size="lg" variant="outline" className="gap-2 rounded-sm border-white/20 bg-black/30 hover:border-primary/50 hover:bg-primary/10" onClick={() => router.push('/collection')}>
                  <Eye className="h-4 w-4" />
                  Моя коллекция
                </Button>
              </div>
            </motion.div>

            <motion.div
              className="hidden h-[600px] grid-cols-2 gap-5 overflow-hidden lg:grid"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="translate-y-10">{renderHeroRail(heroLeft, 'up')}</div>
              <div className="-translate-y-6">{renderHeroRail(heroRight.length ? heroRight : heroLeft, 'down')}</div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 mb-8" id="anime-catalog">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="anime-panel rounded-sm p-4 sm:p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Поиск аниме по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-sm bg-[#111113]/80 border-white/15 text-sm focus-visible:ring-primary/40"
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative h-11 w-full sm:min-w-[210px] sm:w-auto">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as AnimeSortOption)
                      setCurrentPage(1)
                    }}
                    disabled={activeTab === 'guess'}
                    className="h-11 w-full appearance-none rounded-sm border border-white/15 bg-[#111113]/80 pl-9 pr-9 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setIsGenreDialogOpen(true)}
                  className={cn(
                    'h-11 gap-2 rounded-sm text-sm border-white/15 bg-[#111113]/80 hover:border-primary/50 hover:bg-primary/10',
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
                    className="h-11 rounded-sm border-white/15 hover:border-primary/40"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v as TabType)
            setSelectedGenre('')
            setSearchQuery('')
            setCurrentPage(1)
            if (v === 'airing' || v === 'recommendations') setSortBy('POPULARITY_DESC')
          }} className="w-full">
            <TabsList className="w-full sm:w-auto inline-flex gap-1 mb-6 bg-card/70 border border-border/70 p-1.5 rounded-2xl backdrop-blur overflow-x-auto no-scrollbar">
              {tabConfig.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'data-active:bg-primary data-active:text-primary-foreground rounded-xl text-xs sm:text-sm h-8 gap-1.5 px-3 shrink-0 whitespace-nowrap',
                      'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {activeTab === 'guess' ? (
              <div className="max-w-4xl mx-auto">
                {guessStep === 'loading' ? (
                  <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="glass rounded-2xl p-5 sm:p-7">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <GamepadIcon className="h-5 w-5 text-primary" />
                          <h2 className="text-xl font-bold">Аниме-квиз</h2>
                        </div>
                        <p className="text-sm text-foreground-secondary">
                          Вводи название сам: поиск подскажет варианты, но угадывать придется головой.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                          <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Очки</div>
                          <div className="text-lg font-bold text-primary">{guessScore}</div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                          <div className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">Стрик</div>
                          <div className="text-lg font-bold text-foreground">{guessStreak}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 mb-6">
                      {[
                        { value: 'description' as GuessMode, label: 'По описанию', icon: FileText, text: 'Узнай тайтл по синопсису и жанрам.' },
                        { value: 'frames' as GuessMode, label: 'По кадрам', icon: Images, text: 'Узнай аниме по одному-двум кадрам.' },
                      ].map((mode) => {
                        const Icon = mode.icon
                        const active = guessMode === mode.value
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => setGuessMode(mode.value)}
                            className={cn(
                              'text-left rounded-2xl border p-4 transition-all',
                              active
                                ? 'border-primary/50 bg-primary/10 shadow-[0_18px_45px_rgba(239,68,68,0.16)]'
                                : 'border-border bg-muted/30 hover:border-primary/25 hover:bg-muted/50'
                            )}
                          >
                            <div className="flex items-center gap-2 font-semibold">
                              <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
                              {mode.label}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mode.text}</p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                      <div className="rounded-2xl border border-border bg-background/35 p-4 sm:p-5 min-h-[260px]">
                        {guessMode === 'description' && guessAnime && (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-1.5">
                              {guessAnime.genres?.slice(0, 5).map((genre) => (
                                <span key={genre} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                  {translateGenre(genre)}
                                </span>
                              ))}
                            </div>
                            {stripHtml(guessRussianText.description || guessAnime.description) ? (
                              <p className="text-base leading-relaxed text-foreground/90">
                                {stripHtml(guessRussianText.description || guessAnime.description).slice(0, 520)}
                                {stripHtml(guessRussianText.description || guessAnime.description).length > 520 ? '...' : ''}
                              </p>
                            ) : (
                              <div className="rounded-2xl border border-border bg-muted/35 p-4 text-sm leading-relaxed text-foreground-secondary">
                                Описание спряталось, но следы остались: тайтл выходил в {guessAnime.startDate?.year || 'неизвестном году'},
                                формат {guessAnime.format || 'неизвестен'}, жанры: {guessAnime.genres?.slice(0, 4).map(translateGenre).join(', ') || 'без жанров'}.
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                              <span className="rounded-xl bg-muted/50 px-3 py-2">Год: {guessAnime.startDate?.year || '???'}</span>
                              <span className="rounded-xl bg-muted/50 px-3 py-2">Формат: {guessAnime.format || '???'}</span>
                              <span className="rounded-xl bg-muted/50 px-3 py-2">Эпизоды: {guessAnime.episodes || '???'}</span>
                              <span className="rounded-xl bg-muted/50 px-3 py-2">Оценка: {Math.round((guessAnime.meanScore || guessAnime.averageScore || 0) / 10) || '???'}</span>
                            </div>
                          </div>
                        )}

                        {guessMode === 'frames' && (
                          <div className="flex flex-col items-center text-center">
                            {guessFrames.length > 0 ? (
                              <div className="grid w-full gap-3 sm:grid-cols-2">
                                {guessFrames.slice(0, 2).map((frame, index) => (
                                  <img
                                    key={frame}
                                    src={frame}
                                    alt={`Кадр ${index + 1}`}
                                    className="h-40 w-full rounded-2xl object-cover shadow-2xl shadow-black/40 ring-1 ring-border sm:h-48"
                                  />
                                ))}
                              </div>
                            ) : (
                              <img
                                src={getProxiedImageUrl(guessAnime?.coverImage?.extraLarge || guessAnime?.coverImage?.large || '')}
                                alt="Постер-подсказка"
                                className="h-56 w-40 rounded-2xl object-cover shadow-2xl shadow-black/40 ring-1 ring-border"
                              />
                            )}
                            <p className="mt-4 text-xs text-muted-foreground">
                              {guessFrames.length > 0 ? 'Из какого аниме эти кадры?' : 'Кадры не нашлись, держи постер как запасную подсказку.'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Начните вводить название..."
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                            className="h-10 pl-10 bg-background/60 border-border/70"
                          />
                          {guessSearching && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>

                        {guessSearchResults.length > 0 && guessStep === 'ready' && (
                          <div className="overflow-hidden rounded-2xl border border-border bg-background/55">
                            {guessSearchResults.map((result) => (
                              <button
                                key={result.id}
                                type="button"
                                onClick={() => handleGuess(result)}
                                className="flex w-full items-center gap-3 border-b border-border/60 p-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50"
                              >
                                <img
                                  src={getProxiedImageUrl(result.coverImage?.medium || result.coverImage?.large || '')}
                                  alt={result.title.romaji}
                                  className="h-12 w-9 rounded-md object-cover"
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold">{result.title.romaji || result.title.english}</span>
                                  <span className="block text-xs text-muted-foreground">{result.startDate?.year || 'год неизвестен'}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {guessStep === 'ready' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handleGuess()} disabled={!guessInput.trim()} className="gap-2">
                              <Send className="h-4 w-4" />
                              Проверить
                            </Button>
                            <Button variant="outline" onClick={handleHint} className="gap-2">
                              <HelpCircle className="h-4 w-4" />
                              Подсказка
                            </Button>
                            <Button variant="outline" onClick={handleSkip} className="gap-2">
                              <XCircle className="h-4 w-4" />
                              Сдаюсь
                            </Button>
                            <Button variant="outline" onClick={() => startGuessGame(guessMode)} className="gap-2">
                              <RotateCcw className="h-4 w-4" />
                              Новый
                            </Button>
                          </div>
                        )}

                        {guessStep === 'result' && (
                          <Button onClick={() => startGuessGame(guessMode)} className="w-full gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Следующий раунд
                          </Button>
                        )}

                        {guessMessage && (
                          <div className={cn(
                            'rounded-2xl border px-4 py-3 text-sm',
                            guessStep === 'result' ? 'border-primary/30 bg-primary/10 text-foreground' : 'border-border bg-muted/40 text-muted-foreground'
                          )}>
                            {guessMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : loading && animeList.length === 0 ? (
              <div className="anime-grid">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-sm border border-white/10 bg-[#111113]">
                    <div className="skeleton aspect-[2/3] w-full" />
                    <div className="space-y-2 p-2.5">
                      <div className="skeleton h-4 w-5/6" />
                      <div className="skeleton h-4 w-2/3" />
                      <div className="flex gap-1 pt-1">
                        <div className="skeleton h-7 flex-1" />
                        <div className="skeleton h-7 w-7" />
                      </div>
                    </div>
                  </div>
                ))}
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
                    <AniListAnimeCard key={anime.id} anime={anime} isInCollection={collectionIds.has(anime.id)} onAddToCollection={refreshCollection} />
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

      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <GuestBanner variant="inline" />
        </div>
      </section>

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
