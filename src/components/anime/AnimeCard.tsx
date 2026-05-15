'use client'

import { useState } from 'react'
import { JikanAnime } from '@/lib/jikan/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Calendar, PlayCircle, Plus, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AddToCollectionDialog } from './AddToCollectionDialog'

interface AnimeCardProps {
  anime: JikanAnime
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getProxyUrl = (url: string) => {
    if (!url) return ''
    // Заменяем myanimelist.net на cdn.myanimelist.net для лучшей производительности
    const cdnUrl = url.replace('https://myanimelist.net/images/', 'https://cdn.myanimelist.net/images/')
    return `/api/proxy-image?url=${encodeURIComponent(cdnUrl)}`
  }

  const getStatusText = (status: string | null): string => {
    if (!status) return 'Неизвестно'
    const statusMap: Record<string, string> = {
      'Airing': 'Выходит',
      'Completed': 'Завершено',
      'Upcoming': 'Скоро',
    }
    return statusMap[status] || status
  }

  const getTypeText = (type: string | null): string => {
    if (!type) return 'Неизвестно'
    const typeMap: Record<string, string> = {
      'TV': 'ТВ',
      'Movie': 'Фильм',
      'OVA': 'OVA',
      'Special': 'Спец.',
      'ONA': 'ONA',
    }
    return typeMap[type] || type
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {imageError || !anime.images?.jpg?.large_image_url ? (
          <div className="w-full h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <div className="text-center p-4">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Изображение недоступно</p>
            </div>
          </div>
        ) : (
          <img
            src={anime.images.jpg.large_image_url}
            alt={anime.title}
            className="w-full h-64 object-cover"
            loading="lazy"
            onError={(e) => {
              console.error('Image load error:', anime.images.jpg.large_image_url)
              setImageError(true)
            }}
          />
        )}
        {anime.score && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-medium text-sm">{anime.score}</span>
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-2">{anime.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {anime.synopsis || 'Описание отсутствует'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{getTypeText(anime.type)}</Badge>
          <Badge variant="outline">{getStatusText(anime.status)}</Badge>
          {anime.episodes && (
            <Badge variant="outline">{anime.episodes} эп.</Badge>
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
                  {anime.title}
                </DialogDescription>
              </DialogHeader>
              <AddToCollectionDialog
                animeId={anime.mal_id}
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
