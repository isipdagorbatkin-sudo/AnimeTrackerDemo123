'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { MessageSquare, Loader2, Sparkles, Search, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatPreview {
  userId: string
  user: { id: string; username: string; avatar_url: string | null }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function ChatPage() {
  const router = useRouter()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadData()
  }, [mounted])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUserId(user.id)

      const [{ data: profiles }, { data: messages }] = await Promise.all([
        supabase.from('profiles').select('*').order('username', { ascending: true }),
        supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }),
      ])

      setAllUsers((profiles || []).filter(p => p.id !== user.id))

      const partnerMap = new Map<string, { lastMessage: string; lastTime: string }>()
      const unreadMap = new Map<string, number>()

      for (const msg of (messages || [])) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, { lastMessage: msg.content, lastTime: msg.created_at })
        }
        if (msg.receiver_id === user.id && !msg.read_at) {
          unreadMap.set(partnerId, (unreadMap.get(partnerId) || 0) + 1)
        }
      }

      const chatList: ChatPreview[] = []
      for (const [userId, meta] of partnerMap) {
        const profile = profiles?.find(p => p.id === userId)
        if (profile) {
          chatList.push({
            userId,
            user: { id: userId, username: profile.username, avatar_url: profile.avatar_url },
            lastMessage: meta.lastMessage,
            lastMessageTime: meta.lastTime,
            unreadCount: unreadMap.get(userId) || 0,
          })
        }
      }

      chatList.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })

      setChats(chatList)
    } catch (error) {
      console.error('Ошибка при загрузке:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string') return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Только что'
    if (diffMins < 60) return `${diffMins} мин. назад`
    if (diffHours < 24) return `${diffHours} ч. назад`
    if (diffDays < 7) return `${diffDays} дн. назад`
    return date.toLocaleDateString('ru-RU')
  }

  const filteredUsers = allUsers.filter(p =>
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Сообщения
            </h1>
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
          </div>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Общайтесь с любым пользователем
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-3xl">
          <Tabs defaultValue="chats">
            <TabsList className="bg-input border h-auto flex gap-1 overflow-x-auto mb-6 no-scrollbar">
              <TabsTrigger value="chats" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Чаты ({chats.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
                Пользователи ({allUsers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chats">
              {chats.length === 0 ? (
                <div className="text-center py-32">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6">
                    <MessageSquare className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-xl mb-4">
                    У вас пока нет чатов. Найдите пользователя и напишите ему!
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {chats.map((chat) => (
                    <Card key={chat.userId} className="glass">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <button onClick={() => router.push(`/profile/${chat.userId}`)}>
                              <Avatar>
                                <AvatarImage src={chat.user.avatar_url || undefined} />
                                <AvatarFallback>{getInitials(chat.user.username)}</AvatarFallback>
                              </Avatar>
                            </button>
                            {chat.unreadCount > 0 && (
                              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                                {chat.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => router.push(`/chat/${chat.userId}`)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/profile/${chat.userId}`) }}
                                className="font-medium truncate hover:text-primary transition-colors text-left"
                              >
                                {chat.user.username}
                              </button>
                              {chat.lastMessageTime && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  {formatTime(chat.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white/30 truncate">
                              {chat.lastMessage || 'Нет сообщений'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Поиск пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-input border h-12 pl-12"
                  />
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    {searchQuery ? 'Пользователи не найдены' : 'Нет зарегистрированных пользователей'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredUsers.map((profile) => (
                    <Card key={profile.id} className="glass">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 min-w-0">
                            <Avatar>
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>{getInitials(profile.username)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <button
                                onClick={() => router.push(`/profile/${profile.id}`)}
                                className="font-medium truncate hover:text-primary transition-colors text-left"
                              >
                                {profile.username}
                              </button>
                              <p className="text-sm text-muted-foreground">
                                Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => router.push(`/profile/${profile.id}`)}
                              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                              title="Профиль"
                            >
                              <User className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => router.push(`/chat/${profile.id}`)}
                              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                              title="Написать"
                            >
                              <MessageSquare className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}
