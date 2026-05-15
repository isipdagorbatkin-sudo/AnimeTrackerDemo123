'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft, Calendar, User, MessageSquare, Loader2,
  MapPin, Quote, Heart, Film, ListMusic, MessageCircle, Trash2, Send,
  Plus,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAnimeById, getCoverImage, AniListAnime } from '@/lib/anilist/client'
import { getProxiedImageUrl } from '@/lib/image-proxy'
import { fetchRussianText, getRussianText, useRussianTitle } from '@/lib/russian-cache'

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [collection, setCollection] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [favoriteAnime, setFavoriteAnime] = useState<AniListAnime | null>(null)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('')
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const supabase = createClient()
  const favTitle = useRussianTitle(favoriteAnime)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadProfile()
  }, [params.id, mounted])

  const loadProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!profileData) {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
      setCurrentUserId(currentUser?.id || null)
      setIsCurrentUser(currentUser?.id === params.id)

      if (profileData.favorite_anime_id) {
        getAnimeById(profileData.favorite_anime_id).then(data => {
          setFavoriteAnime(data)
          if (data?.idMal) fetchRussianText(data.idMal)
        })
      }

      const [collectionResult, playlistsResult, commentsResult] = await Promise.all([
        supabase
          .from('anime_collection')
          .select('*')
          .eq('user_id', params.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('custom_playlists')
          .select('*')
          .eq('user_id', params.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profile_comments')
          .select('*, author:author_id(id, username, avatar_url)')
          .eq('profile_id', params.id)
          .order('created_at', { ascending: false }),
      ])

      setCollection(collectionResult.data || [])
      setPlaylists(playlistsResult.data || [])
      setComments(commentsResult.data || [])
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim()) return
    setSendingComment(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { error } = await supabase
        .from('profile_comments')
        .insert({
          profile_id: params.id,
          author_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error

      const { data: updated } = await supabase
        .from('profile_comments')
        .select('*, author:author_id(id, username, avatar_url)')
        .eq('profile_id', params.id)
        .order('created_at', { ascending: false })

      setComments(updated || [])
      setNewComment('')
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error)
    } finally {
      setSendingComment(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return
    setCreatingPlaylist(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { data, error } = await supabase
        .from('custom_playlists')
        .insert({
          user_id: user.id,
          name: newPlaylistName.trim(),
          description: newPlaylistDesc.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      setPlaylists(prev => [data, ...prev])
      setNewPlaylistName('')
      setNewPlaylistDesc('')
      setShowNewPlaylist(false)
    } catch (error) {
      console.error('Ошибка при создании плейлиста:', error)
    } finally {
      setCreatingPlaylist(false)
    }
  }

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('custom_playlists')
        .delete()
        .eq('id', playlistId)

      if (error) throw error
      setPlaylists(prev => prev.filter(p => p.id !== playlistId))
    } catch (error) {
      console.error('Ошибка при удалении плейлиста:', error)
    }
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string') return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      watching: 'Смотрю', completed: 'Просмотрено',
      plan_to_watch: 'В планах', dropped: 'Брошено',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      watching: 'bg-green-500/20 text-green-400 border-green-500/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      plan_to_watch: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      dropped: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colorMap[status] || ''
  }

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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-xl">Профиль не найден</p>
      </div>
    )
  }

  const safeCollection = Array.isArray(collection) ? collection : []
  const safePlaylists = Array.isArray(playlists) ? playlists : []
  const safeComments = Array.isArray(comments) ? comments : []
  const watchingItems = safeCollection.filter(i => i.status === 'watching')
  const completedItems = safeCollection.filter(i => i.status === 'completed')
  const droppedItems = safeCollection.filter(i => i.status === 'dropped')
  const planItems = safeCollection.filter(i => i.status === 'plan_to_watch')

  return (
    <div className="min-h-screen relative">
      {profile.background_url && (
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <img
            src={getProxiedImageUrl(profile.background_url)}
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background" />
        </div>
      )}

      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto relative z-10">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Назад
          </Button>

          <Card className="glass">
            {profile.banner_url && (
              <div className="relative h-48 sm:h-64 rounded-t-xl overflow-hidden -mx-6 -mt-6 mb-0">
                <img
                  src={getProxiedImageUrl(profile.banner_url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
              </div>
            )}
            <CardHeader className="pt-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6 sm:gap-0 sm:justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                  <Avatar className={`h-20 w-20 sm:h-24 sm:w-24 ${profile.banner_url ? '-mt-16 sm:-mt-20 ring-4 ring-card' : ''}`}>
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl sm:text-3xl">{getInitials(profile.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-2">
                    <CardTitle className="text-2xl sm:text-3xl break-words">{profile.username}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                      {profile.country && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <MapPin className="h-4 w-4 shrink-0" />
                          {profile.country}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isCurrentUser ? (
                    <Button variant="outline" size="sm" onClick={() => router.push('/profile/settings')}>
                      <User className="h-4 w-4 mr-2" /> Настройки
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => router.push(`/chat/${params.id}`)}>
                      <MessageSquare className="h-4 w-4 mr-2" /> Написать
                    </Button>
                  )}
                </div>
              </div>

              {profile.bio && (
                <div className="mt-6 flex items-start gap-2 text-base text-muted-foreground">
                  <Quote className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
                  <p className="italic">{profile.bio}</p>
                </div>
              )}

              {favoriteAnime && (
                <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <Heart className="h-6 w-6 text-primary shrink-0" />
                  <div className="flex items-center gap-3 min-w-0">
                    {getCoverImage(favoriteAnime) && (
                      <img
                        src={getProxiedImageUrl(getCoverImage(favoriteAnime))}
                        alt=""
                        className="h-12 w-9 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Любимое аниме</p>
                      <p className="text-base font-medium truncate">
                        {favTitle}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="px-4 pb-16 mt-12">
        <div className="container mx-auto max-w-4xl">
          <Tabs defaultValue="collection">
            <TabsList className="bg-input border h-auto flex-wrap mb-8">
              <TabsTrigger value="collection" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Коллекция ({safeCollection.length})
              </TabsTrigger>
              <TabsTrigger value="watching" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Смотрю ({watchingItems.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Просмотрено ({completedItems.length})
              </TabsTrigger>
              <TabsTrigger value="plan_to_watch" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                В планах ({planItems.length})
              </TabsTrigger>
              <TabsTrigger value="dropped" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Брошено ({droppedItems.length})
              </TabsTrigger>
              <TabsTrigger value="playlists" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                <ListMusic className="h-4 w-4 mr-1" />
                Плейлисты ({safePlaylists.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                <MessageCircle className="h-4 w-4 mr-1" />
                Комментарии ({safeComments.length})
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Статистика
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collection">
              {safeCollection.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    {isCurrentUser
                      ? 'Ваша коллекция пуста. Найдите аниме в поиске!'
                      : 'У этого пользователя пока пустая коллекция.'}
                  </p>
                </div>
              ) : (
                <CollectionList items={safeCollection} getStatusText={getStatusText} getStatusColor={getStatusColor} />
              )}
            </TabsContent>

            <TabsContent value="watching">
              <CollectionList items={watchingItems} getStatusText={getStatusText} getStatusColor={getStatusColor} />
            </TabsContent>

            <TabsContent value="completed">
              <CollectionList items={completedItems} getStatusText={getStatusText} getStatusColor={getStatusColor} />
            </TabsContent>

            <TabsContent value="plan_to_watch">
              <CollectionList items={planItems} getStatusText={getStatusText} getStatusColor={getStatusColor} />
            </TabsContent>

            <TabsContent value="dropped">
              <CollectionList items={droppedItems} getStatusText={getStatusText} getStatusColor={getStatusColor} />
            </TabsContent>

            <TabsContent value="playlists">
              {isCurrentUser && (
                <div className="mb-6">
                  {showNewPlaylist ? (
                    <Card className="glass mb-4">
                      <CardHeader>
                        <CardTitle className="text-base">Новый плейлист</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Input
                          placeholder="Название плейлиста"
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          disabled={creatingPlaylist}
                          className="bg-input border"
                        />
                        <Textarea
                          placeholder="Описание (необязательно)"
                          value={newPlaylistDesc}
                          onChange={(e) => setNewPlaylistDesc(e.target.value)}
                          disabled={creatingPlaylist}
                          className="bg-input border"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleCreatePlaylist} disabled={creatingPlaylist || !newPlaylistName.trim()}>
                            {creatingPlaylist ? 'Создание...' : 'Создать'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowNewPlaylist(false)}>
                            Отмена
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button onClick={() => setShowNewPlaylist(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Новый плейлист
                    </Button>
                  )}
                </div>
              )}

              {safePlaylists.length === 0 ? (
                <div className="text-center py-20">
                  <ListMusic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">Плейлистов пока нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safePlaylists.map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      isOwner={isCurrentUser}
                      onDelete={handleDeletePlaylist}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="comments">
              <div className="flex gap-3 mb-6 items-end">
                {isCurrentUser && (
                  <Avatar className="h-9 w-9 shrink-0 mb-1">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(profile.username)}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder={isCurrentUser ? 'Напишите что-нибудь о себе...' : 'Напишите комментарий...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={sendingComment}
                    className="bg-input border min-h-[60px] flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendComment}
                    disabled={sendingComment || !newComment.trim()}
                    className="shrink-0 self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {safeComments.length === 0 ? (
                <div className="text-center py-20">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">Комментариев пока нет</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeComments.map((comment) => (
                    <Card key={comment.id} className="glass">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <button onClick={() => router.push(`/profile/${comment.author_id}`)}>
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={comment.author?.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {comment.author ? getInitials(comment.author.username) : '?'}
                                </AvatarFallback>
                              </Avatar>
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={() => router.push(`/profile/${comment.author_id}`)}
                                  className="text-sm font-medium hover:text-primary transition-colors text-left"
                                >
                                  {comment.author?.username || 'Неизвестно'}
                                </button>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{comment.content}</p>
                            </div>
                          </div>
                          {(isCurrentUser || comment.author_id === currentUserId) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { label: 'Всего аниме', value: safeCollection.length },
                      { label: 'Смотрю сейчас', value: watchingItems.length },
                      { label: 'Просмотрено', value: completedItems.length },
                      { label: 'В планах', value: planItems.length },
                      { label: 'Брошено', value: droppedItems.length },
                      {
                        label: 'Средняя оценка',
                        value: safeCollection.filter(i => i.rating).length > 0
                          ? Math.round(safeCollection.reduce((sum, i) => sum + (i.rating || 0), 0) / safeCollection.filter(i => i.rating).length)
                          : '-',
                      },
                      { label: 'Плейлистов', value: safePlaylists.length },
                      { label: 'Комментариев на стене', value: safeComments.length },
                    ].map((stat) => (
                      <div key={stat.label} className="glass p-6 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}

function CollectionList({
  items,
  getStatusText,
  getStatusColor,
}: {
  items: any[]
  getStatusText: (s: string) => string
  getStatusColor: (s: string) => string
}) {
  const [animeCache, setAnimeCache] = useState<Record<number, AniListAnime | null>>({})

  useEffect(() => {
    if (!Array.isArray(items)) return
    const ids = items.map(i => i.anime_id)
    ids.forEach(id => {
      if (!animeCache[id]) {
        getAnimeById(id).then(data => {
          setAnimeCache(prev => ({ ...prev, [id]: data }))
          if (data?.idMal) fetchRussianText(data.idMal)
        })
      }
    })
  }, [items.length])

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">Нет аниме в этой категории</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const anime = animeCache[item.anime_id]
const title = anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Загрузка...'
        const imageUrl = anime ? getProxiedImageUrl(getCoverImage(anime)) : null

        return (
          <Card key={item.id} className="glass">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {imageUrl && (
                    <img src={imageUrl} alt={title} className="h-16 w-12 rounded object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{title}</p>
                    <CardDescription>
                      Добавлено: {new Date(item.added_at).toLocaleDateString('ru-RU')}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={`${getStatusColor(item.status)} border backdrop-blur-sm shrink-0`}>
                  {getStatusText(item.status)}
                </Badge>
              </div>
            </CardHeader>
            {(item.rating || item.review) && (
              <CardContent>
                <div className="space-y-2">
                  {item.rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Оценка:</span>
                      <span className="font-bold">{item.rating}/100</span>
                    </div>
                  )}
                  {item.review && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.review}</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function PlaylistCard({
  playlist,
  isOwner,
  onDelete,
}: {
  playlist: any
  isOwner: boolean
  onDelete: (id: string) => void
}) {
  const [items, setItems] = useState<any[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const supabase = createClient()
    supabase
      .from('playlist_items')
      .select('*')
      .eq('playlist_id', playlist.id)
      .order('added_at', { ascending: false })
      .then(({ data }) => setItems(data || []))
  }, [expanded, playlist.id])

  return (
    <Card className="glass">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base">{playlist.name}</CardTitle>
            {playlist.description && (
              <CardDescription>{playlist.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(playlist.id) }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Плейлист пуст</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <PlaylistItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function PlaylistItemCard({ item }: { item: any }) {
  const [anime, setAnime] = useState<AniListAnime | null>(null)

  useEffect(() => {
    getAnimeById(item.anime_id).then(data => {
      setAnime(data)
      if (data?.idMal) fetchRussianText(data.idMal)
    })
  }, [item.anime_id])

const ru = anime?.idMal ? getRussianText(anime.idMal)?.title : ''
const title = ru || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Загрузка...'
  const imageUrl = anime ? getProxiedImageUrl(getCoverImage(anime)) : null

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="h-10 w-7 rounded object-cover shrink-0" />
      ) : (
        <div className="h-10 w-7 rounded bg-muted flex items-center justify-center shrink-0">
          <Film className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm truncate">{title}</span>
    </div>
  )
}
