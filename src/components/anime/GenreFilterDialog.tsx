'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Filter, X, Search, Loader2 } from 'lucide-react'
import { getShikimoriGenres, ShikimoriGenre } from '@/lib/shikimori/genres'

interface GenreFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedGenre: string
  onGenreSelect: (genre: string) => void
}

export function GenreFilterDialog({ isOpen, onClose, selectedGenre, onGenreSelect }: GenreFilterDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [genres, setGenres] = useState<ShikimoriGenre[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      if (genres.length === 0) {
        setLoading(true)
        getShikimoriGenres().then(all => {
          setGenres(all.filter(g => g.kind === 'anime'))
        }).finally(() => setLoading(false))
      }
    }
  }, [isOpen])

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return genres
    const q = searchQuery.toLowerCase().trim()
    return genres.filter(g => {
      const ru = g.russian.toLowerCase()
      const en = g.name.toLowerCase()
      return ru.includes(q) || en.includes(q)
    })
  }, [searchQuery, genres])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-400" />
            Фильтр по жанрам
          </DialogTitle>
          <DialogDescription>
            Выберите жанр для фильтрации аниме
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск жанров... (например: Романтика)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-background/60 border-border/70 text-sm"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 py-2">
            {filteredGenres.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Жанры не найдены</p>
            ) : filteredGenres.map((genre) => {
              const isActive = selectedGenre === genre.name
              return (
                <Badge
                  key={genre.id}
                  variant={isActive ? 'default' : 'secondary'}
                  className={`cursor-pointer transition-all duration-200 hover:scale-105 select-none text-xs px-3 py-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/20'
                      : 'bg-white/[0.03] text-muted-foreground/80 border-border/30 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30'
                  }`}
                  onClick={() => {
                    onGenreSelect(selectedGenre === genre.name ? '' : genre.name)
                    onClose()
                  }}
                >
                  {genre.russian || genre.name}
                </Badge>
              )
            })}
          </div>
        )}

        {selectedGenre && (
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <span className="text-sm text-muted-foreground/70">
              Выбран:{' '}
              <span className="text-foreground font-semibold text-primary">
                {genres.find(g => g.name === selectedGenre)?.russian || selectedGenre}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onGenreSelect('')
                onClose()
              }}
              className="gap-2 border-border/40 hover:border-destructive/30 hover:bg-destructive/5"
            >
              <X className="h-4 w-4" />
              Сбросить
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
