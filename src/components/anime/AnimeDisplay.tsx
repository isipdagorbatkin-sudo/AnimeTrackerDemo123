'use client'

import { useState, useEffect } from 'react'
import { AniListAnime, getAnimeById, getCoverImage } from '@/lib/anilist/client'
import { getAnimeById as getShikimoriAnimeById, getFullImageUrl as getShikimoriImageUrl } from '@/lib/shikimori/client'
import { Badge } from '@/components/ui/badge'
import { Star, Calendar, PlayCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { translateGenre } from '@/lib/genres'

interface AnimeDisplayProps {
  animeId: number
  showFullInfo?: boolean
}

function convertAniListToDisplay(anime: AniListAnime) {
  return {
    id: anime.id,
    title: anime.title.romaji || anime.title.english || anime.title.native || 'Без названия',
    titleJapanese: anime.title.native || '',
    description: anime.description?.replace(/<[^>]*>/g, '') || '',
    imageUrl: getCoverImage(anime),
    genres: anime.genres || [],
    score: anime.meanScore || anime.averageScore || 0,
    episodes: anime.episodes || 0,
    status: anime.status,
    year: anime.startDate?.year || 0,
  }
}

export function AnimeDisplay({ animeId, showFullInfo = false }: AnimeDisplayProps) {
  const [anime, setAnime] = useState<ReturnType<typeof convertAniListToDisplay> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

  const getProxyUrl = (url: string) => getProxiedImageUrl(url)

  useEffect(() => {
    const loadAnime = async () => {
      try {
        setLoading(true)
        setError('')

        const data = await getAnimeById(animeId)
        if (data) {
          setAnime(convertAniListToDisplay(data))
          return
        }

        const shikiData = await getShikimoriAnimeById(animeId)
        if (shikiData) {
          setAnime({
            id: shikiData.mal_id || shikiData.id,
            title: shikiData.russian || shikiData.name || 'Без названия',
            titleJapanese: shikiData.japanese?.[0] || '',
            description: shikiData.synopsis || shikiData.description_html?.replace(/<[^>]*>/g, '') || '',
            imageUrl: shikiData.image?.original ? (shikiData.image.original.startsWith('/') ? `https://shikimori.one${shikiData.image.original}` : shikiData.image.original) : '',
            genres: (shikiData.genres || []).map(g => g.russian || g.name),
            score: shikiData.score || 0,
            episodes: shikiData.episodes || 0,
            status: shikiData.status,
            year: shikiData.aired_on ? new Date(shikiData.aired_on).getFullYear() : 0,
          })
          return
        }
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
          alt={anime.title}
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
        <p className="font-semibold mb-1 truncate">{anime?.title}</p>
        {anime?.titleJapanese && (
          <p className="text-sm text-muted-foreground mb-2 truncate">{anime.titleJapanese}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {anime?.genres?.slice(0, 3).map((genre, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {translateGenre(genre)}
            </Badge>
          ))}
        </div>
        {showFullInfo && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {anime?.score > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{Math.round(anime.score / 10)}</span>
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
