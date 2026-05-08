'use client'

import { useState } from 'react'
import { LocalAnime } from '@/lib/local-anime/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Star, Calendar, PlayCircle, Plus, Image as ImageIcon } from 'lucide-react'
import { AddToCollectionDialog } from './AddToCollectionDialog'

interface LocalAnimeCardProps {
  anime: LocalAnime
}

export function LocalAnimeCard({ anime }: LocalAnimeCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getProxyUrl = (url: string) => {
    if (!url) return ''
    // Base64 изображения загружаем напрямую без прокси
    if (url.startsWith('data:')) return url
    return url
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        {imageError || !anime.imageUrl ? (
          <div className={`w-full h-64 bg-gradient-to-br ${anime.gradient} flex items-center justify-center`}>
            <div className="text-center p-4">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm font-medium text-white">{anime.titleRussian || anime.title}</p>
            </div>
          </div>
        ) : (
          <img
            src={getProxyUrl(anime.imageUrl)}
            alt={anime.titleRussian || anime.title}
            className="w-full h-64 object-cover"
            loading="lazy"
            onError={() => {
              console.error('Image load error:', anime.imageUrl)
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
        <CardTitle className="line-clamp-2">{anime.titleRussian || anime.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {anime.titleJapanese || 'Описание отсутствует'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary">{anime.type}</Badge>
          <Badge variant="outline">{anime.status}</Badge>
          {anime.episodes && (
            <Badge variant="outline">{anime.episodes} эп.</Badge>
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
                  {anime.titleRussian || anime.title}
                </DialogDescription>
              </DialogHeader>
              <AddToCollectionDialog
                animeId={anime.id}
                animeTitle={anime.titleRussian || anime.title}
                onClose={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
