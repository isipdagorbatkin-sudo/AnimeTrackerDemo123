'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Edit, Film, Star, Trash2 } from 'lucide-react'
import { AniListAnime, getAnimeById, getCoverImage } from '@/lib/anilist/client'
import { fetchRussianText, getRussianText } from '@/lib/russian-cache'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { translateGenre } from '@/lib/genres'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CollectionStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped'

export interface CollectionAnimeCardItem {
  id: string
  anime_id: number
  status: CollectionStatus | string
  rating?: number | null
  review?: string | null
  added_at: string
}

interface CollectionAnimeCardProps {
  item: CollectionAnimeCardItem
  getStatusText?: (status: string) => string
  getStatusColor?: (status: string) => string
  onEdit?: (item: CollectionAnimeCardItem) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

function defaultStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    watching: 'Смотрю',
    completed: 'Просмотрено',
    plan_to_watch: 'В планах',
    dropped: 'Брошено',
  }
  return statusMap[status] || status
}

function defaultStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    watching: 'bg-green-500/20 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    plan_to_watch: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    dropped: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return colorMap[status] || ''
}

export function CollectionAnimeCard({
  item,
  getStatusText = defaultStatusText,
  getStatusColor = defaultStatusColor,
  onEdit,
  onDelete,
  compact = false,
}: CollectionAnimeCardProps) {
  const router = useRouter()
  const [anime, setAnime] = useState<AniListAnime | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setImageError(false)

    getAnimeById(item.anime_id).then((data) => {
      if (cancelled) return
      setAnime(data)
      setLoading(false)
      if (data?.idMal) {
        fetchRussianText(data.idMal, data.title?.english, data.title?.romaji, data.title?.native).then(() => {
          if (!cancelled) setAnime((prev) => prev ? { ...prev } : prev)
        })
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [item.anime_id])

  const russian = anime?.idMal ? getRussianText(anime.idMal) : null
  const title = russian?.title || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || (loading ? 'Загрузка...' : 'Без названия')
  const nativeTitle = anime?.title?.native || ''
  const imageUrl = anime ? getProxiedImageUrl(getCoverImage(anime)) : ''
  const year = anime?.startDate?.year || anime?.seasonYear
  const episodes = anime?.episodes
  const score = anime?.meanScore || anime?.averageScore || 0
  const href = `/anime/${item.anime_id}`

  const openAnime = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof Element && target.closest('a, button')) return
    router.push(href)
  }

  const onCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    router.push(href)
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openAnime}
      onKeyDown={onCardKeyDown}
      className="group relative cursor-pointer overflow-hidden rounded-sm border border-white/15 bg-[#111113]/88 shadow-[0_14px_28px_rgba(0,0,0,0.3)] transition-colors duration-150 hover:border-primary/40 hover:bg-[#1a1a1d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className={cn('relative z-10 grid gap-4 p-3 sm:p-4', compact ? 'sm:grid-cols-[88px_minmax(0,1fr)]' : 'sm:grid-cols-[104px_minmax(0,1fr)]')}>
        <Link
          href={href}
          className={cn(
            'relative block overflow-hidden rounded-sm border border-white/10 bg-[#111113] shadow-lg shadow-black/30',
            compact ? 'h-32 w-24 sm:h-32 sm:w-[88px]' : 'h-36 w-24 sm:h-36 sm:w-[104px]'
          )}
          aria-hidden="true"
          tabIndex={-1}
        >
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-opacity duration-150 group-hover:opacity-90"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#1e1e20]">
              <Film className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </Link>

        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={href} className="relative z-20 line-clamp-2 text-base font-bold leading-snug tracking-wide transition-colors hover:text-primary sm:text-lg">
                {title}
              </Link>
              {nativeTitle && (
              <p className="mt-1 truncate text-xs text-white/45">{nativeTitle}</p>
              )}
            </div>
            <Badge className={cn(getStatusColor(item.status), 'relative z-20 w-fit shrink-0 rounded-sm border backdrop-blur-sm')}>
              {getStatusText(item.status)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 border border-white/12 bg-black/25 px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(item.added_at).toLocaleDateString('ru-RU')}
            </span>
            {year && <span className="border border-white/12 bg-black/25 px-2.5 py-1">{year}</span>}
            {episodes && <span className="border border-white/12 bg-black/25 px-2.5 py-1">{episodes} эп.</span>}
            {score > 0 && (
              <span className="inline-flex items-center gap-1 border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-yellow-300">
                <Star className="h-3.5 w-3.5 fill-yellow-300" />
                {(score / 10).toFixed(1)}
              </span>
            )}
            {item.rating && (
              <span className="inline-flex items-center gap-1 border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">
                Моя оценка {item.rating}/100
              </span>
            )}
          </div>

          {anime?.genres && anime.genres.length > 0 && (
            <div className="relative z-20 mt-3 flex flex-wrap gap-1.5">
              {anime.genres.slice(0, compact ? 3 : 5).map((genre) => (
                <Link key={genre} href={`/genre/${encodeURIComponent(genre)}`}>
                  <Badge variant="secondary" className="cursor-pointer rounded-sm bg-[#232326] text-xs text-white/60 hover:bg-primary hover:text-primary-foreground">
                    {translateGenre(genre)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {item.review && !compact && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.review}</p>
          )}

          {(onEdit || onDelete) && (
            <div className="relative z-20 mt-4 flex flex-wrap gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" className="rounded-sm" onClick={() => onEdit(item)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" className="rounded-sm" onClick={() => onDelete(item.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
