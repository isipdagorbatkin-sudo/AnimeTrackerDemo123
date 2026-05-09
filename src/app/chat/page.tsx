'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Loader2, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatPreview {
  friendId: string
  friend: { id: string; username: string; avatar_url: string | null }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

type FriendshipRow = {
  friend_id: string
  friend: { id: string; username: string; avatar_url: string | null }
}

type MessageRow = {
  content: string
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadChats()
  }, [mounted])

  const loadChats = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const [{ data: friendshipsAsUser }, { data: friendshipsAsFriend }] = await Promise.all([
        supabase.from('friendships').select('*, friend:profiles!friendships_friend_id_fkey(*)').eq('user_id', user.id).eq('status', 'accepted'),
        supabase.from('friendships').select('*, user:profiles!friendships_user_id_fkey(*)').eq('friend_id', user.id).eq('status', 'accepted'),
      ])

      const allFriendships = [
        ...(friendshipsAsUser || []).map(f => ({ friend_id: f.friend_id, friend: f.friend })),
        ...(friendshipsAsFriend || []).map(f => ({ friend_id: f.user_id, friend: f.user })),
      ] as FriendshipRow[]

      const acceptedFriendships = allFriendships

      if (acceptedFriendships.length === 0) {
        setChats([])
        setLoading(false)
        return
      }

      const chatPreviews: ChatPreview[] = await Promise.all(
        acceptedFriendships.map(async (friendship) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendship.friend_id}),and(sender_id.eq.${friendship.friend_id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)

          const recentMessages = (messages ?? []) as MessageRow[]

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', friendship.friend_id)
            .eq('receiver_id', user.id)
            .is('read_at', null)

          return {
            friendId: friendship.friend_id,
            friend: friendship.friend,
            lastMessage: recentMessages.length > 0 ? recentMessages[0].content : undefined,
            lastMessageTime: recentMessages.length > 0 ? recentMessages[0].created_at : undefined,
            unreadCount: unreadCount || 0,
          }
        })
      )

      chatPreviews.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })

      setChats(chatPreviews)
    } catch (error) {
      console.error('Ошибка при загрузке чатов:', error)
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
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

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 animate-gradient-x" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-20" />
        <div className="container mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Чаты
            </h1>
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
          </div>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Общайтесь с друзьями
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto max-w-3xl">
          {chats.length === 0 ? (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-xl mb-4">
                У вас пока нет чатов. Добавьте друзей и начните общение!
              </p>
              <button
                onClick={() => router.push('/friends')}
                className="text-primary hover:text-primary/80 underline transition-colors"
              >
                Перейти к друзьям
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {chats.map((chat) => (
                <Card
                  key={chat.friendId}
                  className="glass cursor-pointer hover:scale-[1.02] transition-all duration-300"
                  onClick={() => router.push(`/chat/${chat.friendId}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={chat.friend.avatar_url || undefined} />
                          <AvatarFallback>{getInitials(chat.friend.username)}</AvatarFallback>
                        </Avatar>
                        {chat.unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{chat.friend.username}</p>
                          {chat.lastMessageTime && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {formatTime(chat.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage || 'Нет сообщений'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
