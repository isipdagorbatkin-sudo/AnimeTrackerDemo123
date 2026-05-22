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
        className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/85 backdrop-blur-sm shadow-[0_18px_55px_rgba(5,5,10,0.38)] transition-colors duration-300 hover:border-primary/40 hover:shadow-[0_24px_70px_rgba(200,143,90,0.14)]"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '80px' }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(200,143,90,0.12),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
                    'w-full h-full object-cover transition-all duration-300 group-hover:scale-105',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {anime.status && (
              <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-black/65 px-1.5 sm:px-2 py-0.5 rounded-full text-[0.45rem] sm:text-[0.55rem] font-medium text-white/90 ring-1 ring-white/10 backdrop-blur">
                  <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  {getStatusBadge(anime.status)}
                </span>
              </div>
            )}

            {isInCollection && (
              <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-success/90 px-1.5 sm:px-2 py-0.5 rounded-full text-[0.45rem] sm:text-[0.55rem] font-medium text-white shadow-lg shadow-black/20">
                  <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  В коллекции
                </span>
              </div>
            )}

            {score > 0 && (
              <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
                <span className={cn(
                  'inline-flex items-center gap-0.5 sm:gap-1 bg-black/65 px-1 sm:px-1.5 py-0.5 rounded-md text-[0.5rem] sm:text-[0.6rem] font-bold ring-1 ring-white/10 backdrop-blur',
                  getScoreColor(score)
                )}>
                  <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
                  {Math.round(score / 10)}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2">
          <Link href={`/anime/${anime.id}`}>
            <h3 className="text-[0.65rem] sm:text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-150 group-hover:text-primary">
              {title}
            </h3>
          </Link>

          <div className="flex items-center gap-2 text-[0.55rem] sm:text-[0.65rem] text-muted-foreground flex-wrap">
            {anime.format && (
              <span className="px-1.5 py-0.5 rounded bg-muted/70 font-medium">
                {getFormatText(anime.format)}
              </span>
            )}
            {anime.episodes && (
              <span className="hidden sm:flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                {anime.episodes} эп.
              </span>
            )}
            {year && (
              <span className="hidden sm:flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {year}
              </span>
            )}
          </div>

          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 3).map((genre) => (
                <Link key={genre} href={`/genre/${encodeURIComponent(genre)}`}>
                  <span className="text-[0.45rem] sm:text-[0.55rem] font-medium px-1 sm:px-1.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground/70 hover:text-primary transition-colors duration-150">
                    {translateGenre(genre)}
                  </span>
                </Link>
              ))}
              {(anime.genres.length - 3) > 0 && (
                <span className="text-[0.5rem] text-muted-foreground/50">
                  +{anime.genres.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-1 sm:gap-1.5 pt-1">
            <Button
              size="sm"
              variant={isInCollection ? "outline" : "default"}
              className={cn(
                "flex-1 h-6 sm:h-7 gap-0.5 sm:gap-1 text-[0.55rem] sm:text-[0.65rem]",
                isInCollection
                  ? "border-success/30 text-success hover:bg-success/10"
                  : "shadow-[0_10px_30px_rgba(200,143,90,0.2)]"
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
              className="h-6 w-6 sm:h-7 sm:w-7 !p-0 border-primary/20 hover:border-primary/40"
              onClick={(e) => {
                e.preventDefault()
                setIsShareDialogOpen(true)
              }}
            >
              <Share2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
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
