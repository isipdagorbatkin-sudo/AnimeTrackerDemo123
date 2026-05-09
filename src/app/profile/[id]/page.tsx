'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, User, MessageSquare, UserPlus, Share2, Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { AnimeDisplay } from '@/components/anime/AnimeDisplay'

export default function ProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [collection, setCollection] = useState<any[]>([])
  const [friendship, setFriendship] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

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
      setIsCurrentUser(currentUser?.id === params.id)

      const { data: collectionData } = await supabase
        .from('anime_collection')
        .select('*')
        .eq('user_id', params.id)
        .order('updated_at', { ascending: false })

      setCollection(collectionData || [])

      if (currentUser && currentUser.id !== params.id) {
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${params.id}),and(user_id.eq.${params.id},friend_id.eq.${currentUser.id})`)
          .single()

        setFriendship(friendshipData)
      }
    } catch (error) {
      console.error('Ошибка при загрузке профиля:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendFriendRequest = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Вы не авторизованы')

      const { error } = await supabase.from('friendships').insert({
        user_id: currentUser.id,
        friend_id: params.id,
        status: 'pending',
      })

      if (error) throw error

      setFriendship({
        id: '', user_id: currentUser.id, friend_id: params.id,
        status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error)
    }
  }

  const handleAcceptFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendship?.id)

      if (error) throw error
      loadProfile()
    } catch (error) {
      console.error('Ошибка при принятии заявки:', error)
    }
  }

  const getInitials = (name: string) => {
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

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-10 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto relative z-10">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Назад
          </Button>

          <Card className="glass">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0 sm:justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-xl sm:text-2xl">{getInitials(profile.username)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="text-xl sm:text-2xl break-words">{profile.username}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                        Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                      </CardDescription>
                    </div>
                  </div>
                <div className="flex flex-wrap gap-2">
                  {isCurrentUser ? (
                    <Button variant="outline" size="sm" onClick={() => router.push('/profile/settings')}>
                      <User className="h-4 w-4 mr-2" /> Настройки
                    </Button>
                  ) : friendship?.status === 'accepted' ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/chat/${params.id}`)}>
                        <MessageSquare className="h-4 w-4 mr-2" /> Написать
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" /> Поделиться
                      </Button>
                    </>
                  ) : friendship?.status === 'pending' ? (
                    friendship.user_id === params.id ? (
                      <Button size="sm" onClick={handleAcceptFriendRequest}>
                        Принять заявку
                      </Button>
                    ) : (
                      <Badge variant="secondary">Заявка отправлена</Badge>
                    )
                  ) : (
                    <Button size="sm" onClick={handleSendFriendRequest}>
                      <UserPlus className="h-4 w-4 mr-2" /> Добавить в друзья
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-4xl">
          <Tabs defaultValue="collection">
            <TabsList className="bg-input border h-12 mb-6">
              <TabsTrigger value="collection" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Коллекция ({collection.length})
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Статистика
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collection">
              {collection.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    {isCurrentUser
                      ? 'Ваша коллекция пуста. Найдите аниме в поиске!'
                      : 'У этого пользователя пока пустая коллекция.'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {collection.map((item) => (
                    <Card key={item.id} className="glass">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <AnimeDisplay animeId={item.anime_id} />
                          </div>
                          <Badge className={`${getStatusColor(item.status)} border backdrop-blur-sm`}>
                            {getStatusText(item.status)}
                          </Badge>
                        </div>
                        <CardDescription>
                          Добавлено: {new Date(item.added_at).toLocaleDateString('ru-RU')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {item.rating && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Оценка:</span>
                              <span className="font-bold">{item.rating}/100</span>
                            </div>
                          )}
                          {item.review && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.review}
                            </p>
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
                      { label: 'Всего аниме', value: collection.length },
                      { label: 'Смотрю сейчас', value: collection.filter(i => i.status === 'watching').length },
                      { label: 'Просмотрено', value: collection.filter(i => i.status === 'completed').length },
                      {
                        label: 'Средняя оценка',
                        value: collection.filter(i => i.rating).length > 0
                          ? Math.round(collection.reduce((sum, i) => sum + (i.rating || 0), 0) / collection.filter(i => i.rating).length)
                          : '-',
                      },
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
