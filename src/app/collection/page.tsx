'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Trash2, Edit, Loader2, BookOpen, Sparkles } from 'lucide-react'
import { EditCollectionDialog } from '@/components/anime/EditCollectionDialog'
import { AnimeDisplay } from '@/components/anime/AnimeDisplay'

type AnimeCollection = {
  id: string
  user_id: string
  anime_id: number
  source: string
  status: string
  rating: number | null
  review: string | null
  added_at: string
  updated_at: string
}

export default function CollectionPage() {
  const [collection, setCollection] = useState<AnimeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [editingItem, setEditingItem] = useState<AnimeCollection | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadCollection()
  }, [mounted])

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

  const counts = {
    all: collection.length,
    watching: collection.filter(i => i.status === 'watching').length,
    completed: collection.filter(i => i.status === 'completed').length,
    plan_to_watch: collection.filter(i => i.status === 'plan_to_watch').length,
    dropped: collection.filter(i => i.status === 'dropped').length,
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
            Всего аниме: {collection.length}
          </p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="container mx-auto">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-xl">
              {error}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-input border h-12 overflow-x-auto w-full">
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
              <p className="text-muted-foreground text-xl">
                {activeTab === 'all'
                  ? 'Ваша коллекция пуста. Найдите аниме в поиске!'
                  : 'В этом разделе пока ничего нет.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCollection.map((item) => (
                <Card key={item.id} className="glass hover:scale-[1.01] transition-all duration-300">
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
                    <div className="space-y-3">
                      {item.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{item.rating}/100</span>
                        </div>
                      )}
                      {item.review && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.review}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Изменить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
