'use client'

import { useState } from 'react'
import { AnixartAnime } from '@/lib/anixart/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Calendar, PlayCircle, Plus, Image as ImageIcon } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'

interface AnixartAnimeCardProps {
  anime: AnixartAnime
}

export function AnixartAnimeCard({ anime }: AnixartAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'ongoing': 'Выходит',
      'released': 'Завершено',
      'announced': 'Скоро',
    }
    return statusMap[status] || status
  }

  const getTypeText = (type: string): string => {
    const typeMap: Record<string, string> = {
      'tv': 'ТВ',
      'movie': 'Фильм',
      'ova': 'OVA',
      'ona': 'ONA',
      'special': 'Спец.',
    }
    return typeMap[type] || type
  }

  const getScore = (): number | null => {
    return anime.rating ? anime.rating / 10 : null
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {imageError || !anime.poster?.original ? (
          <div className="w-full h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <div className="text-center p-4">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Изображение недоступно</p>
            </div>
          </div>
        ) : (
          <img
            src={anime.poster.original}
            alt={anime.title.ru || anime.title.en}
            className="w-full h-64 object-cover"
            loading="lazy"
            onError={(e) => {
              console.error('Image load error:', anime.poster.original)
              setImageError(true)
            }}
          />
        )}
        {getScore() && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-medium text-sm">{getScore()}</span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">{anime.title.ru || anime.title.en}</CardTitle>
        <CardDescription className="line-clamp-2">
          {anime.title.original || 'Описание отсутствует'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{getTypeText(anime.type)}</Badge>
          <Badge variant="outline">{getStatusText(anime.status)}</Badge>
          {anime.episodes?.total && (
            <Badge variant="outline">{anime.episodes.total} эп.</Badge>
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

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Добавить в коллекцию</DialogTitle>
                <DialogDescription>
                  {anime.title.ru || anime.title.en}
                </DialogDescription>
              </DialogHeader>
              <AddToCollectionDialog
                animeId={anime.id}
                animeTitle={anime.title.ru || anime.title.en}
                onClose={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
