'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  getAnimeById as getAniListAnimeById,
  getAnimeCharacters,
  getSimilarAnime,
  getAnimeRelations,
  getStatusText,
  getFormatText,
  getCoverImage,
  AniListAnime,
  AniListCharacter,
} from '@/lib/anilist/client'
import { useRussianText, useRussianTitle } from '@/lib/russian-cache'
import { AnimePlayerHub } from '@/components/anime/AnimePlayerHub'
import { AnimeFramesStrip } from '@/components/anime/AnimeFramesStrip'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Calendar, PlayCircle, Plus, Share2, Image as ImageIcon, Users, Clock, Loader2, Check } from 'lucide-react'
import { AddToCollectionDialog } from '@/components/anime/AddToCollectionDialog'
import { ShareAnimeDialog } from '@/components/anime/ShareAnimeDialog'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { createClient } from '@/lib/supabase/client'
import { translateGenre } from '@/lib/genres'
import { cleanAnimeDescription } from '@/lib/anime-text'
import Link from 'next/link'

const DESCRIPTION_LIMIT = 750

function TranslatedAnimeTitle({ anime, className }: { anime: AniListAnime; className?: string }) {
  const title = useRussianTitle(anime)
  return <p className={className}>{title}</p>
}

export default function AnimePage() {
  const params = useParams()
  const rawId = params.id as string
  const animeId = parseInt(rawId)
  const isInvalidId = isNaN(animeId)
  const [anime, setAnime] = useState<AniListAnime | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [characters, setCharacters] = useState<AniListCharacter[]>([])
  const [similar, setSimilar] = useState<AniListAnime[]>([])
  const [relations, setRelations] = useState<{ relationType: string; node: AniListAnime }[]>([])
  const [isInCollection, setIsInCollection] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadAnime = async () => {
      try {
        setLoading(true)
        const data = await getAniListAnimeById(animeId)
        if (data) {
          setAnime(data)
          getAnimeCharacters(data.id).then(setCharacters)
          getSimilarAnime(data.id).then(setSimilar)
          getAnimeRelations(data.id).then(setRelations)
        } else {
          setError('Аниме не найдено')
        }
        checkInCollection(animeId)
      } catch (err: any) {
        console.error('Error loading anime:', err)
        setError('Не удалось загрузить информацию об аниме. Попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    loadAnime()
  }, [animeId, mounted])

  useEffect(() => {
    setShowFullDescription(false)
  }, [animeId])

  const checkInCollection = async (id: number) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('anime_collection')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', id)
        .eq('source', 'anilist')
        .maybeSingle()
      setIsInCollection(!!data)
    } catch {}
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RELEASING': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'FINISHED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'NOT_YET_RELEASED': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'CANCELLED': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const russianText = useRussianText(anime)
  const title = russianText.title || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Без названия'
  const nativeTitle = anime?.title?.native || ''
  const year = anime?.startDate?.year
  const description = cleanAnimeDescription(russianText.description || anime?.description)
  const shouldCollapseDescription = description.length > DESCRIPTION_LIMIT
  const visibleDescription = shouldCollapseDescription && !showFullDescription
    ? `${description.slice(0, DESCRIPTION_LIMIT).trim()}...`
    : description
  const score = anime?.meanScore || anime?.averageScore || 0

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (isInvalidId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/20 mb-6">
            <span className="text-5xl">⚠️</span>
          </div>
          <p className="text-destructive text-xl mb-6">Аниме не найдено</p>
          <Link href="/">
            <Button size="lg">
              Вернуться на главную
            </Button>
          </Link>
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

  const imageUrl = getProxiedImageUrl(getCoverImage(anime))
  const seasonRelations = relations.filter((rel) =>
    ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'ALTERNATIVE', 'SUMMARY'].includes(rel.relationType)
  )
  const relationLabel = (type: string): string => {
    const map: Record<string, string> = {
      PREQUEL: 'Предыдущий сезон',
      SEQUEL: 'Следующий сезон',
      PARENT: 'Основной тайтл',
      SIDE_STORY: 'Ответвление',
      ALTERNATIVE: 'Альтернативная версия',
      SUMMARY: 'Краткий пересказ',
      ADAPTATION: 'Адаптация',
      CHARACTER: 'Персонажи',
      OTHER: 'Связанное',
      SPIN_OFF: 'Спин-офф',
    }
    return map[type] || type
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden">
      <div className="mx-auto px-4 py-8 relative w-full max-w-7xl">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="overflow-hidden glass">
              <div className="mx-auto max-w-[200px] sm:max-w-[250px]">
                {!imageError && imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full aspect-[2/3] object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gradient-to-br from-primary/50 to-primary/30 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-3">
                <div className="flex gap-2">
                  {isInCollection ? (
                    <Button size="sm" className="flex-1 h-9" disabled variant="outline">
                      <Check className="mr-2 h-4 w-4 text-green-400" />
                      <span className="text-green-400">В коллекции</span>
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1 h-9" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      В коллекцию
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setIsShareDialogOpen(true)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {characters.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Персонажи
                </h3>
                <div className="space-y-3">
                  {characters.slice(0, 6).map((char) => (
                    <div key={char.id} className="flex items-center gap-3 p-2 rounded-xl bg-card/50 border border-border/30">
                      <img
                        src={getProxiedImageUrl(char.image?.large || char.image?.medium || '')}
                        alt={char.name?.full || ''}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{char.name?.full}</p>
                        {char.name?.native && (
                          <p className="text-xs text-muted-foreground truncate">{char.name.native}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6 min-w-0">
            <div>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block">
                ← Вернуться на главную
              </Link>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent break-words">
                {title}
              </h1>
              {nativeTitle && (
                <p className="text-xl text-muted-foreground mb-2 break-words">{nativeTitle}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={`${getStatusColor(anime.status)} border backdrop-blur-sm`}>
                {getStatusText(anime.status)}
              </Badge>
              <Badge variant="secondary">
                {getFormatText(anime.format)}
              </Badge>
              {year && (
                <Badge variant="outline">
                  {year}
                </Badge>
              )}
              {anime.episodes && (
                <Badge variant="outline">
                  {anime.episodes} эп.
                </Badge>
              )}
              {anime.source && (
                <Badge variant="outline">
                  {anime.source.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {score > 0 && (
                <Card className="glass hover:scale-105 transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      <span className="text-3xl font-bold">{(score / 10).toFixed(1)}</span>
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
              {anime.duration && (
                <Card className="glass hover:scale-105 transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="h-6 w-6 text-primary" />
                      <span className="text-3xl font-bold">{anime.duration}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Мин./эп.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {anime.genres && anime.genres.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Жанры
                </h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <Link key={genre} href={`/genre/${encodeURIComponent(genre)}`}>
                      <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer px-3 py-1.5">
                        {translateGenre(genre)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Описание
                </h3>
                <div className="text-muted-foreground leading-relaxed text-sm sm:text-base md:text-lg break-words">
                  {visibleDescription}
                </div>
                {shouldCollapseDescription && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((value) => !value)}
                    className="mt-3 inline-flex h-9 items-center rounded-xl border border-border/50 bg-card/60 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-muted/45"
                  >
                    {showFullDescription ? 'Свернуть' : 'Посмотреть полностью'}
                  </button>
                )}
              </div>
            )}

            {anime.studios?.nodes && anime.studios.nodes.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Студии</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.studios.nodes.map((studio) => (
                    <Badge key={studio.id} variant="outline">
                      {studio.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-3 mt-8 w-full overflow-hidden">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Кадры из аниме
            </h3>
            <AnimeFramesStrip
              title={title || anime.title?.romaji || anime.title?.english || ''}
              fallbackTitles={[anime.title?.romaji, anime.title?.english, anime.title?.native].filter(Boolean) as string[]}
              idMal={anime.idMal}
              year={anime.startDate?.year || anime.seasonYear}
              episodes={anime.episodes}
            />
          </div>

          <div className="lg:col-span-3 mt-8 w-full overflow-hidden">
            {seasonRelations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Сезоны и части
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-primary/35 bg-primary/10 p-4">
                    <div className="text-xs uppercase tracking-widest text-primary mb-1">Сейчас открыто</div>
                    <div className="font-semibold line-clamp-2">{title}</div>
                    {anime.episodes && <div className="mt-1 text-xs text-muted-foreground">{anime.episodes} эп.</div>}
                  </div>
                  {seasonRelations.map((rel) => {
                    const relAnime = rel.node
                    return (
                      <Link
                        key={`${rel.relationType}-${relAnime.id}`}
                        href={`/anime/${relAnime.id}`}
                        className="rounded-2xl border border-border bg-card/70 p-4 transition-all hover:border-primary/35 hover:bg-muted/40"
                      >
                        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                          {relationLabel(rel.relationType)}
                        </div>
                        <TranslatedAnimeTitle anime={relAnime} className="font-semibold line-clamp-2" />
                        <div className="mt-1 text-xs text-muted-foreground">
                          {[relAnime.startDate?.year, relAnime.episodes ? `${relAnime.episodes} эп.` : null].filter(Boolean).join(' · ') || 'подробнее'}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Смотреть
            </h3>
            {anime && (
              <AnimePlayerHub
                animeTitle={title || anime.title?.romaji || anime.title?.english || ''}
                fallbackTitles={[anime.title?.romaji, anime.title?.english, anime.title?.native].filter(Boolean) as string[]}
                idMal={anime.idMal}
                year={anime.startDate?.year || anime.seasonYear}
                episodes={anime.episodes}
              />
            )}
          </div>

          {relations.length > 0 && (
            <div className="lg:col-span-3 mt-8 w-full overflow-hidden">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Связанное
              </h3>
              {(() => {
                const grouped = relations.reduce<Record<string, { relationType: string; node: AniListAnime }[]>>((acc, r) => {
                  const key = r.relationType
                  if (!acc[key]) acc[key] = []
                  acc[key].push(r)
                  return acc
                }, {})
                return Object.entries(grouped).map(([groupName, groupItems]) => (
                  <div key={groupName} className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{relationLabel(groupName)}</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                      {groupItems.map((rel) => {
                        const a = rel.node
                        const relTitle = a.title?.romaji || a.title?.english || a.title?.native || ''
                        const relImage = getProxiedImageUrl(getCoverImage(a))
                        return (
                          <Link key={a.id} href={`/anime/${a.id}`} className="flex-shrink-0 w-24 sm:w-28 group">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2">
                              {relImage ? (
                                <img
                                  src={relImage}
                                  alt={relTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <TranslatedAnimeTitle anime={a} className="text-xs font-medium line-clamp-2" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          {similar.length > 0 && (
            <div className="lg:col-span-3 mt-8 w-full overflow-hidden">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Похожие
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                {similar.map((a) => {
                  const simTitle = a.title?.romaji || a.title?.english || a.title?.native || ''
                  const simImage = getProxiedImageUrl(getCoverImage(a))
                  return (
                    <Link key={a.id} href={`/anime/${a.id}`} className="flex-shrink-0 w-24 sm:w-28 group">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-muted mb-2">
                        {simImage ? (
                          <img
                            src={simImage}
                            alt={simTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <TranslatedAnimeTitle anime={a} className="text-xs font-medium line-clamp-2" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
