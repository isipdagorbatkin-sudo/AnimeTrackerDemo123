'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Filter, X, Search, Loader2 } from 'lucide-react'
import { getAllGenres } from '@/lib/anilist/client'
import { translateGenre } from '@/lib/genres'

interface GenreFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedGenre: string
  onGenreSelect: (genre: string) => void
}

const ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
  'Ecchi', 'Hentai', 'Avant Garde', 'Boys Love', 'Girls Love', 'Gourmet',
  'Suspense', 'Award Winning', 'Isekai', 'Mahou Shoujo', 'Psychological',
  'Military', 'Historical', 'Martial Arts', 'Mecha', 'Music', 'Parody',
  'Samurai', 'Shoujo', 'Shounen', 'Space', 'Super Power', 'Vampire',
  'Yaoi', 'Yuri', 'Harem', 'Magic', 'School', 'Seinen', 'Josei',
  'Demons', 'Cars', 'Kids', 'Police', 'Game', 'Dementia',
]

export function GenreFilterDialog({ isOpen, onClose, selectedGenre, onGenreSelect }: GenreFilterDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [genres, setGenres] = useState<string[]>(ANILIST_GENRES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      if (genres.length === 0 || genres === ANILIST_GENRES) {
        setLoading(true)
        getAllGenres().then(all => {
          if (all.length > 0) setGenres(all)
        }).finally(() => setLoading(false))
      }
    }
  }, [isOpen])

  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return genres
    const q = searchQuery.toLowerCase().trim()
    return genres.filter(g => {
      const en = g.toLowerCase()
      const ru = translateGenre(g).toLowerCase()
      return en.includes(q) || ru.includes(q)
    })
  }, [searchQuery, genres])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto border-primary/20 bg-card/95 shadow-[0_30px_100px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(239,68,68,0.18),transparent_42%),radial-gradient(circle_at_82%_12%,rgba(90,94,103,0.18),transparent_38%)]" />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded-lg border border-primary/20 bg-primary/10 p-2">
              <Filter className="h-4 w-4 text-primary" />
            </span>
            Фильтр по жанрам
          </DialogTitle>
          <DialogDescription>
            Выберите жанр или найдите его по русскому и английскому названию.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск жанров... (например: Романтика)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background/70 border-primary/15 text-sm focus-visible:ring-primary/40"
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
              const isActive = selectedGenre === genre
              return (
                <Badge
                  key={genre}
                  variant={isActive ? 'default' : 'secondary'}
                  className={`h-8 cursor-pointer select-none rounded-lg px-3 py-1.5 text-xs transition-all duration-200 hover:-translate-y-0.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary to-accent-foreground text-primary-foreground border-transparent shadow-lg shadow-primary/20'
                      : 'bg-white/[0.03] text-muted-foreground/80 border-border/40 hover:bg-primary/10 hover:text-primary hover:border-primary/35'
                  }`}
                  onClick={() => {
                    onGenreSelect(selectedGenre === genre ? '' : genre)
                    onClose()
                  }}
                >
                  {translateGenre(genre)}
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
                {translateGenre(selectedGenre)}
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
