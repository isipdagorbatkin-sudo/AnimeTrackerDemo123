'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [friend, setFriend] = useState<{ id: string; username: string; avatar_url: string | null } | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadChat()
    subscribeToMessages()

    return () => {
      supabase.channel('messages').unsubscribe()
    }
  }, [params.id, mounted])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: friendData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!friendData) {
        router.push('/chat')
        return
      }

      setFriend(friendData)

      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.id}),and(sender_id.eq.${params.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      setMessages(messagesData || [])

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', params.id)
        .eq('receiver_id', user.id)
        .is('read_at', null)
    } catch (error) {
      console.error('Ошибка при загрузке чата:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const { data: { user } } = supabase.auth.getUserSync()

    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user?.id},receiver_id.eq.${params.id}),and(sender_id.eq.${params.id},receiver_id.eq.${user?.id}))`,
        },
        (payload) => {
          const newMsg = payload.new as any
          setMessages((prev) => [...prev, newMsg])
          if (newMsg.sender_id === params.id) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
          }
        }
      )
      .subscribe()
  }

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Вы не авторизованы')

      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: params.id,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error)
    } finally {
      setSending(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
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

  if (!friend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-xl mb-4">Чат не найден</p>
          <Button onClick={() => router.push('/chat')}>Вернуться к чатам</Button>
        </div>
      </div>
    )
  }

  const { data: { user: currentUser } } = supabase.auth.getUserSync()

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/chat')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к чатам
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={friend.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{getInitials(friend.username)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{friend.username}</h1>
              <p className="text-sm text-muted-foreground">Онлайн</p>
            </div>
          </div>
        </div>

        <Card className="glass overflow-hidden">
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className="h-[calc(100vh-350px)] overflow-y-auto p-6 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Начните общение! Напишите первое сообщение.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender_id === currentUser?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-input text-foreground rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-1.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Напишите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  className="bg-input border h-12 text-base"
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="h-12 px-6"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
