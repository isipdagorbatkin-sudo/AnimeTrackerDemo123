'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AniListAnime, getAnimeById } from '@/lib/anilist/client'
import { Button } from '@/components/ui/button'
import { BarChart3, BookOpen, Clock3, Film, Loader2, PlayCircle, Star, Trophy } from 'lucide-react'

type CollectionItem = {
  id: string
  anime_id: number
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped'
  rating: number | null
  added_at: string
}

type EnrichedItem = CollectionItem & {
  anime: AniListAnime | null
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes} мин`
  return `${hours} ч ${minutes} мин`
}

function percent(value: number, total: number): number {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

export default function StatisticsPage() {
  const [items, setItems] = useState<EnrichedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError('')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setItems([])
          setError('Войдите, чтобы увидеть статистику коллекции.')
          return
        }

        const { data, error } = await supabase
          .from('anime_collection')
          .select('id, anime_id, status, rating, added_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) throw error

        const collection = (data || []) as CollectionItem[]
        const enriched = await Promise.all(
          collection.map(async (item) => ({
            ...item,
            anime: await getAnimeById(item.anime_id),
          }))
        )
        setItems(enriched)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось собрать статистику.')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const stats = useMemo(() => {
    const completed = items.filter(item => item.status === 'completed')
    const watching = items.filter(item => item.status === 'watching')
    const planned = items.filter(item => item.status === 'plan_to_watch')
    const dropped = items.filter(item => item.status === 'dropped')
    const rated = items.filter(item => typeof item.rating === 'number')

    const completedEpisodes = completed.reduce((sum, item) => sum + (item.anime?.episodes || 0), 0)
    const completedMinutes = completed.reduce((sum, item) => {
      const episodes = item.anime?.episodes || 0
      const duration = item.anime?.duration || 24
      return sum + episodes * duration
    }, 0)
    const plannedMinutes = planned.reduce((sum, item) => {
      const episodes = item.anime?.episodes || 0
      const duration = item.anime?.duration || 24
      return sum + episodes * duration
    }, 0)
    const averageRating = rated.length
      ? Math.round(rated.reduce((sum, item) => sum + (item.rating || 0), 0) / rated.length)
      : 0

    const longest = [...items]
      .filter(item => item.anime?.episodes)
      .sort((a, b) => (b.anime?.episodes || 0) - (a.anime?.episodes || 0))[0]

    const topRated = [...items]
      .filter(item => item.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]

    return {
      total: items.length,
      completed: completed.length,
      watching: watching.length,
      planned: planned.length,
      dropped: dropped.length,
      completedEpisodes,
      completedMinutes,
      plannedMinutes,
      averageRating,
      longest,
      topRated,
    }
  }, [items])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card/65 p-6 sm:p-8 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(135deg,rgba(200,143,90,0.13),transparent_34%),linear-gradient(225deg,rgba(112,143,128,0.1),transparent_44%)]" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">Статистика</h1>
                <p className="text-sm text-foreground-secondary">Сводка по твоей коллекции и времени просмотра.</p>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-6">
          {[
            { label: 'В коллекции', value: stats.total, icon: BookOpen, note: 'тайтлов всего' },
            { label: 'Просмотрено', value: stats.completedEpisodes, icon: PlayCircle, note: 'эпизодов завершено' },
            { label: 'Время просмотра', value: formatMinutes(stats.completedMinutes), icon: Clock3, note: 'по завершенным тайтлам' },
            { label: 'Средняя оценка', value: stats.averageRating ? `${stats.averageRating}/100` : 'нет', icon: Star, note: 'по оцененным тайтлам' },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-foreground-secondary">{card.label}</span>
                  <div className="rounded-xl bg-muted p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
              </div>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_380px] mt-6">
          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Film className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Статусы коллекции</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Смотрю', value: stats.watching, color: 'bg-success' },
                { label: 'Просмотрено', value: stats.completed, color: 'bg-primary' },
                { label: 'В планах', value: stats.planned, color: 'bg-accent-foreground' },
                { label: 'Брошено', value: stats.dropped, color: 'bg-destructive' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-foreground-secondary">{row.label}</span>
                    <span className="font-semibold">{row.value} · {percent(row.value, stats.total)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${percent(row.value, stats.total)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Личные рекорды</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <div className="text-muted-foreground mb-1">Самый длинный тайтл</div>
                <div className="font-semibold">{stats.longest?.anime?.title?.romaji || 'Пока нет данных'}</div>
                {stats.longest?.anime?.episodes && (
                  <div className="mt-1 text-xs text-muted-foreground">{stats.longest.anime.episodes} эпизодов</div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <div className="text-muted-foreground mb-1">Лучшая твоя оценка</div>
                <div className="font-semibold">{stats.topRated?.anime?.title?.romaji || 'Пока нет оценок'}</div>
                {stats.topRated?.rating && (
                  <div className="mt-1 text-xs text-muted-foreground">{stats.topRated.rating}/100</div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-muted/35 p-4">
                <div className="text-muted-foreground mb-1">Планируемое время</div>
                <div className="font-semibold">{formatMinutes(stats.plannedMinutes)}</div>
                <div className="mt-1 text-xs text-muted-foreground">если досмотреть все из “В планах”</div>
              </div>
            </div>
          </div>
        </section>

        {stats.total === 0 && !error && (
          <section className="mt-6 text-center rounded-2xl border border-border bg-muted/25 p-10">
            <p className="text-foreground-secondary mb-4">Коллекция пока пустая, статистике нечего считать.</p>
            <Link href="/">
              <Button>Найти первое аниме</Button>
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}
