'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Check, X, Loader2, Sparkles } from 'lucide-react'

export default function AddFriendPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sent' | 'already_friends' | 'error'>('idle')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadUserData()
  }, [params.userId, mounted])

  const loadUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (user.id === params.userId) {
        setError('Вы не можете добавить себя в друзья')
        setLoading(false)
        return
      }

      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${params.userId}),and(user_id.eq.${params.userId},friend_id.eq.${user.id})`)
        .single()

      if (existingFriendship) {
        setStatus('already_friends')
        setUserData(existingFriendship)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.userId)
        .single()

      if (!profile) {
        setError('Пользователь не найден')
        setLoading(false)
        return
      }

      setUserData(profile)
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке данных')
      setLoading(false)
    }
  }

  const handleAddFriend = async () => {
    try {
      setSending(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('friendships')
        .insert({ user_id: user.id, friend_id: params.userId, status: 'pending' })

      if (error) throw error

      setStatus('sent')
    } catch (err: any) {
      setError(err.message || 'Ошибка при отправке запроса')
      setStatus('error')
    } finally {
      setSending(false)
    }
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

  if (error && status !== 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="py-12 text-center">
            <X className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/friends')}>Вернуться к друзьям</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'already_friends') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="py-12 text-center">
            <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Вы уже друзья!</h2>
            <p className="text-muted-foreground mb-6">Этот пользователь уже добавлен в ваши друзья</p>
            <Button onClick={() => router.push('/friends')}>Вернуться к друзьям</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="py-12 text-center">
            <Check className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Запрос отправлен!</h2>
            <p className="text-muted-foreground mb-6">
              Запрос на добавление в друзья отправлен пользователю {userData?.username}
            </p>
            <Button onClick={() => router.push('/friends')}>Вернуться к друзьям</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="glass w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            <CardTitle className="text-2xl">Добавить в друзья</CardTitle>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <CardDescription>Хотите добавить {userData?.username} в друзья?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 glass p-4 rounded-xl">
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt={userData.username} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {userData?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold">{userData?.username}</h3>
                <p className="text-sm text-muted-foreground">Пользователь AnimeTracker</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAddFriend} disabled={sending} className="flex-1 h-12">
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Отправка...</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" /> Добавить в друзья</>
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push('/friends')} disabled={sending} className="h-12">
                Отмена
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
