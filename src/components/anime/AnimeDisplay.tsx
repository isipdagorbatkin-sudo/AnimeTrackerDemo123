'use client'

import { useState, useEffect } from 'react'
import { LocalAnime } from '@/lib/local-anime/db'
import { getLocalAnimeById } from '@/lib/local-anime/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, PlayCircle, Loader2, Image as ImageIcon } from 'lucide-react'

interface AnimeDisplayProps {
  animeId: number
  showFullInfo?: boolean
}

export function AnimeDisplay({ animeId, showFullInfo = false }: AnimeDisplayProps) {
  const [anime, setAnime] = useState<LocalAnime | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getProxyUrl = (url: string) => {
    if (!url) return ''
    // Base64 изображения загружаем напрямую без прокси
    if (url.startsWith('data:')) return url
    return url
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadAnime = async () => {
      try {
        setLoading(true)
        const data = getLocalAnimeById(animeId)
        setAnime(data)
      } catch (err: any) {
        console.error('Error loading anime:', err)
        // Если не удалось загрузить, используем базовую информацию
        const basicAnime: LocalAnime = {
          id: animeId,
          title: `Anime #${animeId}`,
          titleRussian: `Anime #${animeId}`,
          titleJapanese: null,
          description: null,
          imageUrl: '',
          gradient: 'from-purple-500/20 to-pink-500/20',
          genres: [],
          score: 0,
          episodes: 0,
          status: 'unknown',
          type: 'unknown',
          year: 0,
        }
        setAnime(basicAnime)
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [animeId, mounted])

  if (!mounted) {
    return (
      <div className="py-8">
        <p className="text-center text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !anime) {
    return (
      <div className="py-8">
        <p className="text-center text-muted-foreground">
          {error || 'Не удалось загрузить информацию об аниме'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      {anime?.imageUrl && !imageError ? (
        <img
          src={getProxyUrl(anime.imageUrl)}
          alt={anime.titleRussian || anime.title}
          className="w-24 h-32 object-cover rounded-lg"
          loading="lazy"
          onError={() => {
            console.error('Image load error:', anime.imageUrl)
            setImageError(true)
          }}
        />
      ) : (
        <div className="w-24 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold mb-1 truncate">{anime?.titleRussian || anime?.title}</p>
        {anime?.titleJapanese && (
          <p className="text-sm text-muted-foreground mb-2 truncate">{anime.titleJapanese}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {anime?.genres?.slice(0, 3).map((genre, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {genre}
            </Badge>
          ))}
        </div>
        {showFullInfo && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {anime?.score && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{anime.score}</span>
              </div>
            )}
            {anime?.year && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{anime.year}</span>
              </div>
            )}
            {anime?.episodes && (
              <div className="flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" />
                <span>{anime.episodes} эп.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
