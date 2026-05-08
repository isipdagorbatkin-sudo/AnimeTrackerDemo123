'use client'

import { useState } from 'react'
import { AniListAnime } from '@/lib/anilist/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Calendar, PlayCircle, Plus, Share2, Image as ImageIcon } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'
import { ShareAnimeDialog } from './ShareAnimeDialog'
import Link from 'next/link'

interface AniListAnimeCardProps {
  anime: AniListAnime
}

export function AniListAnimeCard({ anime }: AniListAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RELEASING':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'FINISHED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'NOT_YET_RELEASED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RELEASING':
        return 'Выходит'
      case 'FINISHED':
        return 'Завершено'
      case 'NOT_YET_RELEASED':
        return 'Анонс'
      case 'CANCELLED':
        return 'Отменено'
      default:
        return status
    }
  }

  const getTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      'TV': 'ТВ',
      'TV_SHORT': 'ТВ (короткий)',
      'MOVIE': 'Фильм',
      'OVA': 'OVA',
      'ONA': 'ONA',
      'SPECIAL': 'Спец.',
      'MUSIC': 'Музыка',
    }
    return typeMap[type] || type
  }

  const getScore = (): number | null => {
    return anime.averageScore ? anime.averageScore / 10 : null
  }

  const title = anime.title.english || anime.title.romaji || 'Без названия'

  return (
    <>
      <Card className="overflow-hidden glass hover:scale-105 transition-all duration-300 cursor-pointer group">
        <Link href={`/anime/${anime.id}`}>
          <div className="relative card-image">
            {imageError || !anime.coverImage?.large ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
              </div>
            ) : (
              <img
                src={anime.coverImage.large}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={() => {
                  console.error('Image load error:', anime.coverImage.large)
                  setImageError(true)
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {getScore() && (
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-white font-semibold text-sm">{getScore()}</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge className={`${getStatusColor(anime.status)} border backdrop-blur-sm`}>
                {getStatusText(anime.status)}
              </Badge>
            </div>
          </div>
        </Link>

        <CardHeader className="pb-3 pt-4">
          <Link href={`/anime/${anime.id}`}>
            <CardTitle className="line-clamp-2 hover:text-primary transition-colors cursor-pointer card-title">
              {title}
            </CardTitle>
          </Link>
          {anime.title.native && (
            <CardDescription className="line-clamp-1 text-xs">
              {anime.title.native}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-3 card-content">
          <div className="flex flex-wrap gap-1.5">
            {anime.genres?.slice(0, 3).map((genre, index) => (
              <Link key={index} href={`/genre/${encodeURIComponent(genre)}`}>
                <Badge variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  {genre}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground card-meta">
            {anime.episodes && (
              <div className="flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>{anime.episodes} эп.</span>
              </div>
            )}
            {anime.seasonYear && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{anime.seasonYear}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 text-white border-0"
              onClick={(e) => {
                e.preventDefault()
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              В коллекцию
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                setIsShareDialogOpen(true)
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Добавить в коллекцию</DialogTitle>
            <DialogDescription>
              {title}
            </DialogDescription>
          </DialogHeader>
          <AddToCollectionDialog
            animeId={anime.id}
            animeTitle={title}
            onClose={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ShareAnimeDialog
        animeId={anime.id}
        animeTitle={title}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
      />
    </>
  )
}
