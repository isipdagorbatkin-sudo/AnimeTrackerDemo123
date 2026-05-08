'use client'

import { useState } from 'react'
import { JikanAnime } from '@/lib/jikan/types'
import { Button } from '@/components/ui/button'
import { Plus, Star, Calendar, PlayCircle, Share2, Image as ImageIcon, Clock, ChevronRight } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'
import { ShareAnimeDialog } from './ShareAnimeDialog'
import { getStatusText, getTypeText } from '@/lib/jikan/client'
import Link from 'next/link'
import { translateGenre } from '@/lib/genres'
import { cn } from '@/lib/utils'

interface JikanAnimeCardProps {
  anime: JikanAnime
}

function getScoreColor(score: number): string {
  if (score >= 9) return 'text-emerald-400 stroke-emerald-400'
  if (score >= 8) return 'text-green-400 stroke-green-400'
  if (score >= 7) return 'text-yellow-400 stroke-yellow-400'
  if (score >= 6) return 'text-orange-400 stroke-orange-400'
  return 'text-red-400 stroke-red-400'
}

function ScoreRing({ score }: { score: number }) {
  const r = 18
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 10) * circumference
  const color = getScoreColor(score)

  return (
    <div className="score-ring">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle className="bg" cx="22" cy="22" r={r} strokeWidth="3" />
        <circle
          className={`fill ${color}`}
          cx="22"
          cy="22"
          r={r}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className={cn('absolute text-[0.65rem] font-bold', color)}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

export function JikanAnimeCard({ anime }: JikanAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const title = anime.title_english || anime.title
  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.webp?.large_image_url || ''

  return (
    <>
      <div className="group/card relative overflow-hidden rounded-2xl bg-card/40 backdrop-blur-sm border border-border/40 hover:border-purple-500/25 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/8 hover:-translate-y-1.5 cursor-pointer">
        <Link href={`/anime/${anime.mal_id}`}>
          {/* Image Container */}
          <div className="relative card-image overflow-hidden">
            {imageError || !imageUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#12152a] to-[#0a0c18]">
                <div className="text-center p-4">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-muted-foreground/50 line-clamp-2">{title}</p>
                </div>
              </div>
            ) : (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#12152a] to-[#0a0c18] animate-shimmer" />
                )}
                <img
                  src={imageUrl}
                  alt={title}
                  className={cn(
                    'w-full h-full object-cover transition-all duration-700 group-hover/card:scale-105',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

            {/* Top badges row */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 shadow-lg">
                <Clock className="h-3 w-3 text-purple-300" />
                <span className="text-white text-[0.6rem] font-semibold">{getStatusText(anime.status)}</span>
              </div>
            </div>

            {/* Bottom hover info - slides up */}
            <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-400 ease-out">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white/90 text-xs font-medium">Подробнее</span>
                  <ChevronRight className="h-3 w-3 text-white/70" />
                </div>
              </div>
            </div>

            {/* Hover Glow */}
            <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="relative px-3.5 pt-3 pb-3.5 space-y-2.5">
          {/* Title + Score */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <Link href={`/anime/${anime.mal_id}`}>
                <h3 className="text-sm font-semibold leading-snug group-hover/card:text-purple-300 transition-colors duration-200 line-clamp-2">
                  {title}
                </h3>
              </Link>
              {anime.title_japanese && (
                <p className="text-[0.6rem] text-muted-foreground/40 line-clamp-1 mt-0.5">
                  {anime.title_japanese}
                </p>
              )}
            </div>
            {anime.score && (
              <div className="shrink-0 mt-0.5">
                <ScoreRing score={anime.score} />
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2.5 text-[0.65rem] text-muted-foreground/60 flex-wrap">
            {anime.type && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.03] border border-border/20 font-medium">
                {getTypeText(anime.type)}
              </span>
            )}
            {anime.episodes && (
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                <span>{anime.episodes} эп.</span>
              </span>
            )}
            {anime.year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{anime.year}</span>
              </span>
            )}
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 2).map((genre) => (
                <Link key={genre.mal_id} href={`/genre/${encodeURIComponent(genre.name)}`}>
                  <span className="text-[0.55rem] font-medium px-1.5 py-0.5 rounded-full bg-white/[0.03] text-muted-foreground/50 border border-border/20 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/20 transition-all duration-200">
                    {translateGenre(genre.name)}
                  </span>
                </Link>
              ))}
              {(anime.genres.length - 2) > 0 && (
                <span className="text-[0.55rem] text-muted-foreground/30">
                  +{anime.genres.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-1.5 pt-0.5">
            <Button
              size="sm"
              className="flex-1 h-8 gap-1.5 bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 text-white shadow-lg shadow-purple-500/15 hover:shadow-purple-500/25 transition-all duration-200 text-[0.7rem]"
              onClick={(e) => {
                e.preventDefault()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="h-3 w-3" />
              В коллекцию
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 !p-0 border-border/30 hover:border-purple-500/25 hover:bg-purple-500/5"
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

      <AddToCollectionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        animeId={anime.mal_id}
        animeTitle={title}
      />

      <ShareAnimeDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        animeId={anime.mal_id}
        animeTitle={title}
      />
    </>
  )
}
