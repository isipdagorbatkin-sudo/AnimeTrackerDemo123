'use client'

import { useState, useEffect } from 'react'
import { LocalAnime, getLocalAnimeById } from '@/lib/local-anime/db'
import { getAnimeById } from '@/lib/jikan/client'
import { JikanAnime } from '@/lib/jikan/types'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, PlayCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'


interface AnimeDisplayProps {
  animeId: number
  showFullInfo?: boolean
}

function getGradient(id: number): string {
  const gradients = [
    'from-blue-500/20 to-purple-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-pink-500/20 to-red-500/20',
    'from-red-500/20 to-orange-500/20',
    'from-orange-500/20 to-yellow-500/20',
    'from-yellow-500/20 to-green-500/20',
    'from-green-500/20 to-teal-500/20',
    'from-teal-500/20 to-cyan-500/20',
    'from-cyan-500/20 to-blue-500/20',
    'from-indigo-500/20 to-purple-500/20',
  ]
  return gradients[id % gradients.length]
}

function convertJikanToLocal(jikan: JikanAnime): LocalAnime {
  return {
    id: jikan.mal_id,
    title: jikan.title_english || jikan.title,
    titleRussian: jikan.title,
    titleJapanese: jikan.title_japanese || '',
    description: jikan.synopsis || '',
    imageUrl: jikan.images?.jpg?.large_image_url || jikan.images?.jpg?.image_url || '',
    gradient: getGradient(jikan.mal_id),
    genres: (jikan.genres || []).map(g => g.name),
    score: jikan.score || 0,
    episodes: jikan.episodes || 0,
    status: jikan.status || 'unknown',
    type: jikan.type || 'unknown',
    year: jikan.year || 0,
  }
}

export function AnimeDisplay({ animeId, showFullInfo = false }: AnimeDisplayProps) {
  const [anime, setAnime] = useState<LocalAnime | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

  const getProxyUrl = (url: string) => getProxiedImageUrl(url)

  useEffect(() => {
    const loadAnime = async () => {
      try {
        setLoading(true)
        setError('')

        const localData = getLocalAnimeById(animeId)
        if (localData) {
          setAnime(localData)
          return
        }

        const jikanData = await getAnimeById(animeId)
        setAnime(convertJikanToLocal(jikanData))
      } catch (err: any) {
        console.error('Error loading anime:', err)
        setError('Не удалось загрузить информацию об аниме')
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [animeId])

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
          onError={() => setImageError(true)}
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
            {anime?.score > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{anime.score}</span>
              </div>
            )}
            {anime?.year > 0 && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{anime.year}</span>
              </div>
            )}
            {anime?.episodes > 0 && (
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
