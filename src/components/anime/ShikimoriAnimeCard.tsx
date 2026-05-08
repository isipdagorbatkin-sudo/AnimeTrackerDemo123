'use client'

import { useState } from 'react'
import { ShikimoriAnime, getTypeText } from '@/lib/shikimori/client'
import { Button } from '@/components/ui/button'
import { Plus, Star, Calendar, PlayCircle, Share2, Image as ImageIcon, Clock } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'
import { ShareAnimeDialog } from './ShareAnimeDialog'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ShikimoriAnimeCardProps {
  anime: ShikimoriAnime
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400'
  if (score >= 6) return 'text-yellow-400'
  return 'text-red-400'
}

export function ShikimoriAnimeCard({ anime }: ShikimoriAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const title = anime.russian || anime.name
  const rawImageUrl = anime.image?.original || ''
  const fullImageUrl = rawImageUrl.startsWith('/') ? `https://shikimori.one${rawImageUrl}` : rawImageUrl
  const imageUrl = fullImageUrl ? `/api/proxy-image?url=${encodeURIComponent(fullImageUrl)}` : ''

  const statusMap: Record<string, string> = {
    anons: 'Анонс',
    ongoing: 'Выходит',
    released: 'Завершено',
  }
  const urlId = anime.id
  const collectionId = anime.mal_id || anime.id

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-[0_18px_60px_rgba(8,8,20,0.45)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_80px_rgba(168,85,247,0.2)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <Link href={`/anime/${urlId}`}>
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
                <span className="inline-flex items-center gap-0.5 sm:gap-1 bg-black/70 px-1.5 sm:px-2 py-0.5 rounded-full text-[0.45rem] sm:text-[0.55rem] font-medium text-white/90">
                  <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                  {statusMap[anime.status] || anime.status}
                </span>
              </div>
            )}

            {anime.score > 0 && (
              <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
                <span className={cn(
                  'inline-flex items-center gap-0.5 sm:gap-1 bg-black/70 px-1 sm:px-1.5 py-0.5 rounded-md text-[0.5rem] sm:text-[0.6rem] font-bold',
                  getScoreColor(anime.score)
                )}>
                  <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current" />
                  {anime.score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2">
          <Link href={`/anime/${urlId}`}>
            <h3 className="text-[0.65rem] sm:text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-150 group-hover:text-primary">
              {title}
            </h3>
          </Link>

          <div className="flex items-center gap-2 text-[0.55rem] sm:text-[0.65rem] text-muted-foreground flex-wrap">
            {anime.kind && (
              <span className="px-1.5 py-0.5 rounded bg-muted/70 font-medium">
                {getTypeText(anime.kind)}
              </span>
            )}
            {anime.episodes > 0 && (
              <span className="hidden sm:flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                {anime.episodes} эп.
              </span>
            )}
            {anime.aired_on && (
              <span className="hidden sm:flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(anime.aired_on).getFullYear()}
              </span>
            )}
          </div>

          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 2).map((genre) => (
                <span key={genre.id} className="text-[0.45rem] sm:text-[0.55rem] font-medium px-1 sm:px-1.5 py-0.5 rounded-full bg-muted/70 text-muted-foreground/70">
                  {genre.russian || genre.name}
                </span>
              ))}
              {(anime.genres.length - 2) > 0 && (
                <span className="text-[0.5rem] text-muted-foreground/50">
                  +{anime.genres.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-1 sm:gap-1.5 pt-1">
            <Button
              size="sm"
              className="flex-1 h-6 sm:h-7 gap-0.5 sm:gap-1 text-[0.55rem] sm:text-[0.65rem] shadow-[0_10px_30px_rgba(168,85,247,0.25)]"
              onClick={(e) => {
                e.preventDefault()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">В коллекцию</span>
              <span className="sm:hidden">+</span>
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
      </div>

      <AddToCollectionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        animeId={collectionId}
        animeTitle={title}
      />

      <ShareAnimeDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        animeId={collectionId}
        animeTitle={title}
      />
    </>
  )
}
