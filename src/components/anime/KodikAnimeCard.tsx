'use client'

import { useState } from 'react'
import { KodikAnime } from '@/lib/kodik/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Calendar, PlayCircle, Plus, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AddToCollectionDialog } from './AddToCollectionDialog'

interface KodikAnimeCardProps {
  anime: KodikAnime
}

export function KodikAnimeCard({ anime }: KodikAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getStatusText = (anime: KodikAnime): string => {
    if (anime.last_season && anime.last_episode) {
      return 'Завершено'
    }
    return 'Выходит'
  }

  const getTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      'anime': 'Фильм',
      'anime-serial': 'Сериал',
      'anime-3d': '3D',
    }
    return typeMap[type] || type
  }

  const getAnimeId = (): number => {
    // Try to get ID from various sources
    if (anime.shikimori_id) return parseInt(anime.shikimori_id)
    if (anime.kinopoisk_id) return parseInt(anime.kinopoisk_id)
    if (anime.imdb_id) return parseInt(anime.imdb_id.replace(/\D/g, '')) || 0
    // Fallback to hash of the title
    return anime.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }

  const animeId = getAnimeId()

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {imageError || !anime.screenshots || anime.screenshots.length === 0 ? (
          <div className="w-full h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <div className="text-center p-4">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Изображение недоступно</p>
            </div>
          </div>
        ) : (
          <img
            src={anime.screenshots[0]}
            alt={anime.title}
            className="w-full h-64 object-cover"
            loading="lazy"
            onError={(e) => {
              console.error('Image load error:', anime.screenshots[0])
              setImageError(true)
            }}
          />
        )}
        {anime.quality && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-white font-medium text-sm">{anime.quality}</span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">{anime.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {anime.title_orig || anime.other_title || 'Описание отсутствует'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{getTypeText(anime.type)}</Badge>
          <Badge variant="outline">{getStatusText(anime)}</Badge>
          {anime.episodes_count && (
            <Badge variant="outline">{anime.episodes_count} эп.</Badge>
          )}
          {anime.year && (
            <Badge variant="outline">{anime.year}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            В коллекцию
          </Button>
          {anime.link && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open(anime.link, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить в коллекцию</DialogTitle>
                <DialogDescription>
                  {anime.title}
                </DialogDescription>
              </DialogHeader>
              <AddToCollectionDialog
                animeId={animeId}
                animeTitle={anime.title}
                onClose={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
