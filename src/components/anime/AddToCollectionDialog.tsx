'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusSelector } from './StatusSelector'
import { Star, Loader2, BookmarkPlus } from 'lucide-react'

interface AddToCollectionDialogProps {
  isOpen: boolean
  onClose: () => void
  animeId: number
  animeTitle: string
  onSuccess?: () => void
}

export function AddToCollectionDialog({ isOpen, onClose, animeId, animeTitle, onSuccess }: AddToCollectionDialogProps) {
  const [status, setStatus] = useState<'watching' | 'completed' | 'plan_to_watch' | 'dropped'>('watching')
  const [rating, setRating] = useState<number>(0)
  const [review, setReview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Вы не авторизованы')
      }

      const { data: existing } = await supabase
        .from('anime_collection')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', animeId)
        .eq('source', 'anilist')
        .maybeSingle()

      if (existing) {
        throw new Error('Это аниме уже в вашей коллекции')
      }

      const { error } = await supabase.from('anime_collection').insert({
        user_id: user.id,
        anime_id: animeId,
        source: 'anilist',
        status,
        rating: rating > 0 ? rating : null,
        review: review.trim() || null,
      })

      if (error) throw error

      onClose()
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Ошибка при добавлении')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-purple-400" />
            Добавить в коллекцию
          </DialogTitle>
          <DialogDescription>
            {animeTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Статус</Label>
            <StatusSelector value={status} onChange={setStatus} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating" className="text-sm font-medium">Оценка</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-5 w-5 fill-amber-400/30" />
              </div>
              <Input
                id="rating"
                type="number"
                min="1"
                max="100"
                placeholder="От 1 до 100"
                value={rating || ''}
                onChange={(e) => setRating(parseInt(e.target.value) || 0)}
                className="border-border/40 bg-white/[0.02] max-w-28"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review" className="text-sm font-medium">Отзыв</Label>
            <Textarea
              id="review"
              placeholder="Поделитесь впечатлениями..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              className="border-border/40 bg-white/[0.02] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              type="button"
              className="flex-1 border-border/40"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
