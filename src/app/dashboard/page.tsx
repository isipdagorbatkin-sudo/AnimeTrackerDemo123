import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, MessageSquare, TrendingUp, Sparkles, Flame } from 'lucide-react'
import { AnimeDisplayServer } from '@/components/anime/AnimeDisplayServer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [
    { count: collectionCount },
    { count: watchingCount },
    { count: friendsCount },
    { count: unreadMessagesCount },
  ] = await Promise.all([
    supabase.from('anime_collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('anime_collection').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'watching'),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted'),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).is('read_at', null),
  ])

  const stats = [
    {
      title: 'Всего аниме',
      value: collectionCount || 0,
      description: 'В вашей коллекции',
      icon: BookOpen,
      gradient: 'from-purple-500 to-blue-500',
      gradientBg: 'from-purple-500/10 to-blue-500/10',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Смотрю сейчас',
      value: watchingCount || 0,
      description: 'Активный просмотр',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      gradientBg: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Друзья',
      value: friendsCount || 0,
      description: 'В друзьях',
      icon: Users,
      gradient: 'from-cyan-500 to-blue-500',
      gradientBg: 'from-cyan-500/10 to-blue-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Непрочитанные',
      value: unreadMessagesCount || 0,
      description: 'Сообщения',
      icon: MessageSquare,
      gradient: 'from-amber-500 to-orange-500',
      gradientBg: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-400',
    },
  ]

  const { data: recentAnime } = await supabase
    .from('anime_collection')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen">
      {/* Cinematic Dashboard Header */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-purple-500/8 rounded-full blur-3xl animate-aurora" />
          <div className="absolute top-10 -right-40 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl animate-aurora" style={{ animationDelay: '-8s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-purple-500/20">
              <Flame className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Добро пожаловать
              </h1>
              <p className="text-foreground-secondary text-sm sm:text-base mt-1">
                Вот ваша статистика и последние добавления
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.title}
                  className="glass-card rounded-2xl p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground-secondary">{stat.title}</span>
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradientBg} ring-1 ring-white/[0.04]`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-foreground-secondary/60 mt-1.5">{stat.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Additions */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card rounded-2xl p-5 sm:p-6 animate-fade-in-up stagger-3">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 ring-1 ring-purple-500/10">
                <BookOpen className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Последние добавления</h2>
                <p className="text-sm text-foreground-secondary/60">Аниме, которые вы недавно добавили</p>
              </div>
            </div>
            <div>
              {recentAnime && recentAnime.length > 0 ? (
                <div className="space-y-3">
                  {recentAnime.map((item, i) => (
                    <div
                      key={item.id}
                      className="glass !rounded-xl p-4 animate-fade-in-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <AnimeDisplayServer animeId={item.anime_id} />
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/20">
                        <span className="status text-[0.65rem]">
                          <span className={`status-dot w-1.5 h-1.5 rounded-full ${
                            item.status === 'watching' ? 'bg-emerald-500' :
                            item.status === 'completed' ? 'bg-cyan-500' :
                            item.status === 'plan_to_watch' ? 'bg-purple-500' : 'bg-red-500'
                          }`} />
                          {getStatusText(item.status)}
                        </span>
                        {item.rating && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-foreground-secondary/60">Оценка:</span>
                            <span className="text-sm font-semibold text-gradient-primary">{item.rating}/100</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/5 mb-4 ring-1 ring-purple-500/10">
                    <Sparkles className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-foreground-secondary">Вы пока не добавили аниме в коллекцию</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    watching: 'Смотрю',
    completed: 'Просмотрено',
    plan_to_watch: 'В планах',
    dropped: 'Брошено',
  }
  return statusMap[status] || status
}
