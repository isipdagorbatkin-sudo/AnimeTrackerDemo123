'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Check, X, MessageSquare, Users, Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FriendsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadFriendsData()
  }, [mounted])

  const loadFriendsData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Вы не авторизованы')

      const [
        { data: acceptedFriends },
        { data: incomingRequests },
        { data: outgoingRequests },
      ] = await Promise.all([
        supabase.from('friendships').select('*, friend:profiles!friendships_friend_id_fkey(*)').eq('user_id', user.id).eq('status', 'accepted'),
        supabase.from('friendships').select('*, user:profiles!friendships_user_id_fkey(*)').eq('friend_id', user.id).eq('status', 'pending'),
        supabase.from('friendships').select('*, friend:profiles!friendships_friend_id_fkey(*)').eq('user_id', user.id).eq('status', 'pending'),
      ])

      setFriends(acceptedFriends || [])
      setPendingRequests(incomingRequests || [])
      setSentRequests(outgoingRequests || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных')
    } finally {
      setPageLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery}%`)
        .limit(10)

      if (error) throw error

      setSearchResults(data || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при поиске')
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Вы не авторизованы')

      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      })

      if (error) throw error

      const friend = searchResults.find(p => p.id === friendId)
      if (friend) {
        setSentRequests([...sentRequests, {
          id: '', user_id: user.id, friend_id: friendId,
          status: 'pending', created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(), friend,
        }])
      }

      setSearchResults(searchResults.filter(p => p.id !== friendId))
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке заявки')
    }
  }

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error
      loadFriendsData()
    } catch (err: any) {
      setError(err.message || 'Ошибка при принятии заявки')
    }
  }

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error
      loadFriendsData()
    } catch (err: any) {
      setError(err.message || 'Ошибка при отклонении заявки')
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!mounted || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Друзья
            </h1>
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Найдите друзей и общайтесь
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-3xl">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-xl">
              {error}
            </div>
          )}

          <Tabs defaultValue="friends" className="space-y-6">
            <TabsList className="bg-input border h-12">
              <TabsTrigger value="friends" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Друзья ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Заявки ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="search" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Поиск
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends">
              {friends.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-lg">У вас пока нет друзей. Найдите их в поиске!</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {friends.map((friendship) => (
                    <Card key={friendship.id} className="glass hover:scale-[1.01] transition-all duration-300">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={friendship.friend.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(friendship.friend.username)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{friendship.friend.username}</p>
                              <p className="text-sm text-muted-foreground">
                                Друзья с {new Date(friendship.created_at).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/chat/${friendship.friend.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Написать
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">У вас нет входящих заявок</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="glass">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={request.user.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(request.user.username)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.user.username}</p>
                              <p className="text-sm text-muted-foreground">Хочет добавить вас в друзья</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => acceptFriendRequest(request.id)}>
                              <Check className="h-4 w-4 mr-2" />
                              Принять
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => rejectFriendRequest(request.id)}>
                              <X className="h-4 w-4 mr-2" />
                              Отклонить
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="search">
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Поиск пользователей</CardTitle>
                  <CardDescription>Найдите друзей по имени пользователя</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                    <Input
                      type="text"
                      placeholder="Введите имя пользователя..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      disabled={loading}
                      className="bg-input border h-12"
                    />
                    <Button type="submit" disabled={loading || !searchQuery.trim()} className="h-12 px-6">
                      <Search className="mr-2 h-4 w-4" />
                      {loading ? 'Поиск...' : 'Найти'}
                    </Button>
                  </form>

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      {searchResults.map((profile) => {
                        const isRequestSent = sentRequests.some(r => r.friend_id === profile.id)
                        return (
                          <div key={profile.id} className="flex items-center justify-between p-4 glass rounded-xl">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(profile.username)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{profile.username}</p>
                                <p className="text-sm text-muted-foreground">
                                  Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                                </p>
                              </div>
                            </div>
                            {isRequestSent ? (
                              <Badge variant="secondary">Заявка отправлена</Badge>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => sendFriendRequest(profile.id)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Добавить
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {!loading && searchResults.length === 0 && searchQuery && (
                    <p className="text-center text-muted-foreground py-8">Пользователи не найдены</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
