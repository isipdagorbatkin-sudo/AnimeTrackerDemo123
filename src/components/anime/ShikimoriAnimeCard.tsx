'use client'

import { useState } from 'react'
import { ShikimoriAnime } from '@/lib/shikimori/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Calendar, PlayCircle, Plus, Image as ImageIcon } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'

interface ShikimoriAnimeCardProps {
  anime: ShikimoriAnime
}

export function ShikimoriAnimeCard({ anime }: ShikimoriAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getProxyUrl = (url: string) => {
    if (!url) return ''
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'anons': 'Скоро',
      'ongoing': 'Выходит',
      'released': 'Завершено',
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
      'tv_13': 'ТВ (13+)',
      'tv_24': 'ТВ (24+)',
      'tv_48': 'ТВ (48+)',
    }
    return typeMap[type] || type
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {imageError || !anime.image?.original ? (
          <div className="w-full h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <div className="text-center p-4">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Изображение недоступно</p>
            </div>
          </div>
        ) : (
          <img
            src={getProxyUrl(anime.image.original)}
            alt={anime.russian || anime.name}
            className="w-full h-64 object-cover"
            loading="lazy"
            onError={() => {
              console.error('Image load error:', anime.image.original)
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
        <CardTitle className="line-clamp-2">{anime.russian || anime.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {anime.japanese[0] || anime.english[0] || 'Описание отсутствует'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{getTypeText(anime.kind)}</Badge>
          <Badge variant="outline">{getStatusText(anime.status)}</Badge>
          {anime.episodes && (
            <Badge variant="outline">{anime.episodes} эп.</Badge>
          )}
          {anime.aired_on && (
            <Badge variant="outline">{new Date(anime.aired_on).getFullYear()}</Badge>
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
                  {anime.russian || anime.name}
                </DialogDescription>
              </DialogHeader>
              <AddToCollectionDialog
                animeId={anime.id}
                animeTitle={anime.russian || anime.name}
                onClose={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
