import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, MessageSquare, TrendingUp, Sparkles, Flame } from 'lucide-react'
import { AnimeDisplayServer } from '@/components/anime/AnimeDisplayServer'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-3xl p-8 sm:p-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Персональный хаб недоступен</h1>
            <p className="text-foreground-secondary mt-3 text-sm sm:text-base">
              Войдите, чтобы открыть дашборд, коллекцию и социальные функции.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className={buttonVariants({ size: 'lg' })}
              >
                Войти
              </Link>
              <Link
                href="/"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'border-primary/30 hover:border-primary/50')}
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const [
    { count: collectionCount },
    { count: watchingCount },
    { count: friendsAsUserCount },
    { count: friendsAsFriendCount },
    { count: unreadMessagesCount },
  ] = await Promise.all([
    supabase.from('anime_collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('anime_collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'watching'),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted'),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('friend_id', user.id).eq('status', 'accepted'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).is('read_at', null),
  ])
  const friendsCount = (friendsAsUserCount || 0) + (friendsAsFriendCount || 0)

  const stats = [
    {
      title: 'Всего аниме',
      value: collectionCount || 0,
      description: 'В вашей коллекции',
      icon: BookOpen,
      color: 'text-primary',
    },
    {
      title: 'Смотрю сейчас',
      value: watchingCount || 0,
      description: 'Активный просмотр',
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      title: 'Друзья',
      value: friendsCount || 0,
      description: 'В друзьях',
      icon: Users,
      color: 'text-cyan-400',
    },
    {
      title: 'Непрочитанные',
      value: unreadMessagesCount || 0,
      description: 'Сообщения',
      icon: MessageSquare,
      color: 'text-amber-400',
    },
  ]

  const { data: recentAnime } = await supabase
    .from('anime_collection')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
    .limit(5)

  return (
    <div>
      {/* Header */}
      <section className="px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Добро пожаловать
              </h1>
              <p className="text-foreground-secondary text-sm mt-0.5">
                Вот ваша статистика и последние добавления
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.title}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground-secondary">{stat.title}</span>
                    <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-foreground-secondary/60 mt-1">{stat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Additions */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Последние добавления</h2>
                <p className="text-sm text-foreground-secondary/60">Аниме, которые вы недавно добавили</p>
              </div>
            </div>
            <div>
              {recentAnime && recentAnime.length > 0 ? (
                <div className="space-y-3">
                  {recentAnime.map((item, i) => (
                    <div key={item.id} className="bg-muted border border-border rounded-xl p-4">
                      <AnimeDisplayServer animeId={item.anime_id} />
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-border">
                        <span className="status">
                          {item.status === 'watching' ? 'Смотрю' :
                           item.status === 'completed' ? 'Просмотрено' :
                           item.status === 'plan_to_watch' ? 'В планах' : 'Брошено'}
                        </span>
                        {item.rating && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-foreground-secondary/60">Оценка:</span>
                            <span className="text-sm font-semibold text-primary">{item.rating}/100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/5 mb-4">
                    <Sparkles className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-foreground-secondary text-sm">Вы пока не добавили аниме в коллекцию</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
