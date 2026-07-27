'use client'

import { useState } from 'react'
import { AniListAnime, getFormatText, getCoverImage } from '@/lib/anilist/client'
import { useRussianTitle } from '@/lib/russian-cache'
import { Button } from '@/components/ui/button'
import { Plus, Star, Calendar, PlayCircle, Share2, Image as ImageIcon, Clock, Check } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'
import { ShareAnimeDialog } from './ShareAnimeDialog'
import { cn } from '@/lib/utils'
import { translateGenre } from '@/lib/genres'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface AniListAnimeCardProps {
  anime: AniListAnime
  isInCollection?: boolean
  onAddToCollection?: () => void
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

function getStatusBadge(status: string): string {
  const map: Record<string, string> = {
    RELEASING: 'Выходит',
    FINISHED: 'Завершено',
    NOT_YET_RELEASED: 'Анонс',
    CANCELLED: 'Отменено',
    HIATUS: 'На паузе',
  }
  return map[status] || status
}

export function AniListAnimeCard({ anime, isInCollection, onAddToCollection }: AniListAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const title = useRussianTitle(anime)
  const rawImageUrl = getCoverImage(anime)
  const imageUrl = getProxiedImageUrl(rawImageUrl)
  const year = anime.startDate?.year
  const score = anime.meanScore || anime.averageScore || 0

  return (
    <>
      <motion.div
        className="group relative z-0 w-full overflow-visible transition-colors duration-150 hover:z-30"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '80px' }}
        whileHover={{ y: -6, scale: 1.035 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative overflow-hidden rounded-sm border border-white/10 bg-[#111113] shadow-[0_10px_22px_rgba(0,0,0,0.3)] transition-all duration-200 group-hover:border-primary/45 group-hover:shadow-[0_18px_36px_rgba(0,0,0,0.42)]">
          <Link href={`/anime/${anime.id}`}>
            <div className="relative card-image">
            {imageError || !imageUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-[#0d0f1a]">
                <div className="text-center p-4">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs font-medium text-muted-foreground/50 line-clamp-2">{title}</p>
                </div>
              </div>
            ) : (
              <>
                {!imageLoaded && <div className="absolute inset-0 skeleton" />}
                <img
                  src={imageUrl}
                  alt={title}
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-150 ease-out group-hover:opacity-90',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/8 to-transparent opacity-70 transition-opacity duration-150 group-hover:opacity-90" />

            {anime.status && (
              <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-black/70 px-1.5 sm:px-2 py-0.5 rounded-sm text-[0.45rem] sm:text-[0.55rem] font-medium text-white/90 ring-1 ring-white/10 backdrop-blur">
                  <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  {getStatusBadge(anime.status)}
                </span>
              </div>
            )}

            {isInCollection && (
              <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-green-500/90 px-1.5 sm:px-2 py-0.5 rounded-sm text-[0.45rem] sm:text-[0.55rem] font-medium text-white shadow-lg shadow-black/20">
                  <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  В коллекции
                </span>
              </div>
            )}

            {score > 0 && (
              <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
                <span className={cn(
                  'inline-flex items-center gap-0.5 sm:gap-1 bg-black/70 px-1 sm:px-1.5 py-0.5 rounded-sm text-[0.5rem] sm:text-[0.6rem] font-bold ring-1 ring-white/10 backdrop-blur',
                  getScoreColor(score)
                )}>
                  <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
                  {Math.round(score / 10)}
                </span>
              </div>
            )}
            </div>
          </Link>

          <div className="space-y-1.5 bg-[#111113] p-2.5 min-h-[140px] flex flex-col">
          <Link href={`/anime/${anime.id}`}>
            <h3 className="line-clamp-2 min-h-9 text-[0.78rem] font-semibold leading-snug tracking-tight text-white/90 transition-colors duration-150 group-hover:text-primary sm:text-[0.82rem]">
              {title}
            </h3>
          </Link>

          <div className="flex items-center justify-between gap-2 text-[0.6rem] text-white/50 sm:text-[0.66rem]">
            {anime.format && (
              <span className="font-medium">
                {getFormatText(anime.format)}
              </span>
            )}
            {year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {year}
              </span>
            )}
          </div>

          {anime.genres && anime.genres.length > 0 && (
            <div className="flex min-h-5 flex-wrap gap-1 overflow-hidden">
              {anime.genres.slice(0, 2).map((genre) => (
                <Link key={genre} href={`/genre/${encodeURIComponent(genre)}`}>
                  <span className="text-[0.5rem] sm:text-[0.56rem] font-medium px-1.5 py-0.5 bg-[#232326] text-white/55 hover:text-primary transition-colors duration-150">
                    {translateGenre(genre)}
                  </span>
                </Link>
              ))}
              {(anime.genres.length - 2) > 0 && (
                <span className="text-[0.56rem] text-muted-foreground/50">
                  +{anime.genres.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-1 pt-1 mt-auto">
            <Button
              size="sm"
              variant={isInCollection ? "outline" : "default"}
              className={cn(
                "flex-1 h-7 gap-1 rounded-sm text-[0.6rem] sm:text-[0.66rem]",
                isInCollection
                  ? "border-green-400/30 text-green-400 hover:bg-green-400/10"
                  : "bg-[#2f3236] text-white hover:bg-primary"
              )}
              onClick={(e) => {
                e.preventDefault()
                if (!isInCollection) setIsAddDialogOpen(true)
              }}
            >
              {isInCollection ? (
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              )}
              <span className="hidden sm:inline">{isInCollection ? 'В коллекции' : 'В коллекцию'}</span>
              <span className="sm:hidden">{isInCollection ? '✓' : '+'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 !p-0 rounded-sm border-white/15 bg-[#1e1e20] hover:border-primary/50"
              onClick={(e) => {
                e.preventDefault()
                setIsShareDialogOpen(true)
              }}
            >
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -left-6 -top-5 z-40 hidden w-80 overflow-hidden bg-[#1a1a1d] opacity-0 shadow-3xl drop-shadow-2xl transition-all duration-300">
          <div className="relative h-36 w-full overflow-hidden">
            {imageUrl && !imageError && (
              <img src={getProxiedImageUrl(anime.bannerImage || rawImageUrl)} alt="" className="h-full w-full object-cover brightness-75" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1d] via-transparent to-transparent" />
          </div>
          <div className="space-y-2 p-2">
            <div
              className="line-clamp-2 border-l-[3px] border-primary px-2 py-1 text-sm font-medium tracking-wide"
              style={{ backgroundImage: 'linear-gradient(to right, rgba(239,68,68,0.22), rgba(0,0,0,0))' }}
            >
              {title}
            </div>
            <div className="mx-2 flex items-center justify-between gap-x-2 border-b border-[#545454] pb-1 text-xs text-gray-300">
              <p>{anime.format ? getFormatText(anime.format) : 'TV'}</p>
              <div className="h-5 w-px bg-[#333]" />
              <p>{anime.episodes || '?'} эп.</p>
              {score > 0 && (
                <>
                  <div className="h-5 w-px bg-[#333]" />
                  <p className="flex items-center gap-x-1"><Star className="h-3.5 w-3.5" /> {(score / 10).toFixed(1)}</p>
                </>
              )}
            </div>
            {anime.genres && anime.genres.length > 0 && (
              <div className="mx-2 line-clamp-1 border-b border-[#545454] pb-1 text-xs text-gray-300">
                {anime.genres.slice(0, 5).map(translateGenre).join(', ')}
              </div>
            )}
            <div className="flex gap-2 px-2 pb-2">
              <Link href={`/anime/${anime.id}`} className="bg-[#2f3236] px-2 py-1 text-xs transition-colors hover:bg-primary">
                Подробнее
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <AddToCollectionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        animeId={anime.id}
        animeTitle={title}
        onSuccess={onAddToCollection}
      />

      <ShareAnimeDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        animeId={anime.id}
        animeTitle={title}
      />
    </>
  )
}
