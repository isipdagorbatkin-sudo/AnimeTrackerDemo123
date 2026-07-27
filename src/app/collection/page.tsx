'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, BookOpen, Sparkles } from 'lucide-react'
import { EditCollectionDialog } from '@/components/anime/EditCollectionDialog'
import { CollectionAnimeCard } from '@/components/anime/CollectionAnimeCard'
import { getAnimeById } from '@/lib/anilist/client'
import { fetchRussianText, getRussianText } from '@/lib/russian-cache'
import { normalizeAnimeTitleKey } from '@/lib/anime-text'
import { Database } from '@/types/database'
import { GuestBanner } from '@/components/auth/GuestBanner'

type AnimeCollection = Database['public']['Tables']['anime_collection']['Row']

export default function CollectionPage() {
  const [collection, setCollection] = useState<AnimeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [editingItem, setEditingItem] = useState<AnimeCollection | null>(null)
  const [mounted, setMounted] = useState(false)
  const [titleKeys, setTitleKeys] = useState<Record<number, string>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadCollection()
  }, [mounted])

  useEffect(() => {
    const missingIds = Array.from(new Set(collection.map(item => item.anime_id)))
      .filter(id => !titleKeys[id])
    if (missingIds.length === 0) return

    let cancelled = false
    Promise.all(missingIds.map(async (id) => {
      const anime = await getAnimeById(id)
      if (!anime) return [id, String(id)] as const

      if (anime.idMal) {
        await fetchRussianText(anime.idMal, anime.title?.english, anime.title?.romaji, anime.title?.native)
      }

      const russian = anime.idMal ? getRussianText(anime.idMal) : null
      const title = russian?.title || anime.title?.romaji || anime.title?.english || anime.title?.native || String(id)
      return [id, normalizeAnimeTitleKey(title) || String(id)] as const
    })).then((entries) => {
      if (cancelled) return
      setTitleKeys(prev => {
        const next = { ...prev }
        entries.forEach(([id, key]) => {
          next[id] = key
        })
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [collection, titleKeys])

  const loadCollection = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { data, error } = await supabase
        .from('anime_collection')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setCollection(data || [])
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке коллекции')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это аниме из коллекции?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('anime_collection')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCollection(collection.filter(item => item.id !== id))
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении')
    }
  }

  const handleUpdate = (updatedItem: AnimeCollection) => {
    setCollection(collection.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    ))
    setEditingItem(null)
  }

  const filteredCollection = activeTab === 'all'
    ? collection
    : collection.filter(item => item.status === activeTab)

  const countUniqueTitles = (items: AnimeCollection[]) => {
    return new Set(items.map(item => titleKeys[item.anime_id] || String(item.anime_id))).size
  }

  const counts = {
    all: countUniqueTitles(collection),
    watching: countUniqueTitles(collection.filter(i => i.status === 'watching')),
    completed: countUniqueTitles(collection.filter(i => i.status === 'completed')),
    plan_to_watch: countUniqueTitles(collection.filter(i => i.status === 'plan_to_watch')),
    dropped: countUniqueTitles(collection.filter(i => i.status === 'dropped')),
  }

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      watching: 'Смотрю',
      completed: 'Просмотрено',
      plan_to_watch: 'В планах',
      dropped: 'Брошено',
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
              Моя коллекция
            </h1>
            <Sparkles className="h-5 w-5 sm:h-8 sm:w-8 text-primary animate-pulse" />
          </div>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Всего тайтлов: {counts.all}
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto">
          {error && (
            <div className="mb-6">
              {error === 'Вы не авторизованы' ? (
                <GuestBanner variant="banner" />
              ) : (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-xl">
                  {error}
                </div>
              )}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-input border h-12 flex gap-1 overflow-x-auto w-full no-scrollbar">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-foreground shrink-0">
                Все ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="watching" className="data-[state=active]:bg-primary data-[state=active]:text-foreground shrink-0">
                Смотрю ({counts.watching})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-foreground shrink-0">
                Просмотрено ({counts.completed})
              </TabsTrigger>
              <TabsTrigger value="plan_to_watch" className="data-[state=active]:bg-primary data-[state=active]:text-foreground shrink-0">
                В планах ({counts.plan_to_watch})
              </TabsTrigger>
              <TabsTrigger value="dropped" className="data-[state=active]:bg-primary data-[state=active]:text-foreground shrink-0">
                Брошено ({counts.dropped})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredCollection.length === 0 ? (
            <div className="text-center py-32">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-6">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-xl mb-6">
                {activeTab === 'all'
                  ? 'Ваша коллекция пуста. Найдите аниме в поиске!'
                  : 'В этом разделе пока ничего нет.'}
              </p>
              <GuestBanner variant="inline" />
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredCollection.map((item) => (
                <CollectionAnimeCard
                  key={item.id}
                  item={item}
                  getStatusText={getStatusText}
                  getStatusColor={getStatusColor}
                  onEdit={(nextItem) => setEditingItem(nextItem as AnimeCollection)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {editingItem && (
        <EditCollectionDialog
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
