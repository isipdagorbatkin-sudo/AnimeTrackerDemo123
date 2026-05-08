'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getAnimeByMalId, getStatusText, getTypeText, ShikimoriAnime } from '@/lib/shikimori/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Calendar, PlayCircle, Plus, Share2, Image as ImageIcon, Users, Clock, Loader2 } from 'lucide-react'
import { AddToCollectionDialog } from '@/components/anime/AddToCollectionDialog'
import { ShareAnimeDialog } from '@/components/anime/ShareAnimeDialog'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import Link from 'next/link'

export default function AnimePage() {
  const params = useParams()
  const animeId = parseInt(params.id as string)
  const [anime, setAnime] = useState<ShikimoriAnime | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadAnime = async () => {
      try {
        setLoading(true)
        const data = await getAnimeByMalId(animeId)
        setAnime(data)
      } catch (err: any) {
        console.error('Error loading anime:', err)
        setError('Не удалось загрузить информацию об аниме. Попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [animeId, mounted])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'released': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'anons': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const title = anime?.russian || anime?.name || 'Без названия'
  const year = anime?.aired_on ? new Date(anime.aired_on).getFullYear() : null
  const description = anime?.synopsis || anime?.description_html?.replace(/<[^>]+>/g, '')

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/20 mb-6">
            <span className="text-5xl">⚠️</span>
          </div>
          <p className="text-destructive text-xl mb-6">{error || 'Не удалось загрузить аниме'}</p>
          <Link href="/">
            <Button size="lg">
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const rawImage = anime.image.original || ''
  const fullImage = rawImage.startsWith('/') ? `https://shikimori.one${rawImage}` : rawImage
  const imageUrl = getProxiedImageUrl(fullImage)

  return (
    <div className="min-h-screen">
      {/* Banner */}
      {imageUrl && !imageError && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8 -mt-48 relative z-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Cover */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden glass">
              {!imageError && imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-gradient-to-br from-primary/50 to-primary/30 flex items-center justify-center">
                  <ImageIcon className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    В коллекцию
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsShareDialogOpen(true)}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block">
                ← Вернуться на главную
              </Link>
              <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {title}
              </h1>
              {anime.japanese && anime.japanese.length > 0 && (
                <p className="text-xl text-muted-foreground mb-2">{anime.japanese[0]}</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${getStatusColor(anime.status)} border backdrop-blur-sm`}>
                {getStatusText(anime.status)}
              </Badge>
              <Badge variant="secondary">
                {getTypeText(anime.kind)}
              </Badge>
              {year && (
                <Badge variant="outline">
                  {year}
                </Badge>
              )}
              {anime.rating && (
                <Badge variant="outline">
                  {anime.rating}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {anime.score && (
                <Card className="glass hover:scale-105 transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      <span className="text-3xl font-bold">{anime.score.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Оценка</p>
                  </CardContent>
                </Card>
              )}
              {anime.episodes && (
                <Card className="glass hover:scale-105 transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <PlayCircle className="h-6 w-6 text-primary" />
                      <span className="text-3xl font-bold">{anime.episodes}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Эпизодов</p>
                  </CardContent>
                </Card>
              )}
              {year && (
                <Card className="glass hover:scale-105 transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar className="h-6 w-6 text-primary" />
                      <span className="text-3xl font-bold">{year}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Год</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Жанры
                </h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre, index) => (
                    <Link key={index} href={`/genre/${encodeURIComponent(genre.name)}`}>
                      <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer px-3 py-1.5">
                        {genre.russian || genre.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {description && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Описание
                </h3>
                <div className="text-muted-foreground leading-relaxed text-lg">
                  {description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddToCollectionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        animeId={animeId}
        animeTitle={title}
      />

      <ShareAnimeDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        animeId={animeId}
        animeTitle={title}
      />
    </div>
  )
}
