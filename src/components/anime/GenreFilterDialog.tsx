'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Filter, X, Sparkles } from 'lucide-react'
import { translateGenre } from '@/lib/genres'

const JIKAN_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Music',
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Award Winning', 'Boys Love', 'Girls Love', 'Gourmet', 'Isekai', 'Suspense',
  'Avant Garde', 'Ecchi', 'Erotica', 'Hentai', 'Mahou Shoujo', 'Mahou Shounen', 'Parody',
  'Samurai', 'Shoujo', 'Shounen', 'Space', 'Vampire', 'Yaoi', 'Yuri', 'Kids', 'Cars',
  'Dementia', 'Game', 'Military', 'Police', 'Super Power', 'Demons', 'Historical',
  'Martial Arts', 'School', 'Seinen', 'Josei', 'Harem', 'Magic', 'Visual Arts', 'Workplace',
  'Reincarnation', 'Reverse Harem', 'Time Travel', 'Video Game', 'Cyberpunk', 'Steampunk',
  'Post-Apocalyptic', 'Zombies', 'Aliens', 'Robots', 'Survival', 'Tragedy', 'Wuxia', 'Xianxia',
  'Iyashikei', 'Chibi', 'CGDCT', 'Anthology', 'Crossdressing', 'Delinquents', 'Gag Humor',
  'High Stakes Games', 'Idols', 'Love Polygon', 'Otaku Culture', 'Showbiz', 'Strategy Game',
  'Tournament', 'Urban Fantasy', 'Villainess', 'Virtual Reality', 'Childcare', 'Cooking',
  'Detective', 'Educational', 'Family', 'Medical', 'Organized Crime', 'Performing Arts', 'Racing',
  'Showbiz', 'Team Sports', 'Traditional Games', 'Adult Cast', 'Anthropomorphic', 'CGI',
  'Child Protagonist', 'Empire', 'Fantasy World',
]

interface GenreFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedGenre: string
  onGenreSelect: (genre: string) => void
}

export function GenreFilterDialog({ isOpen, onClose, selectedGenre, onGenreSelect }: GenreFilterDialogProps) {
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

        <div className="flex flex-wrap gap-2 py-2">
          {JIKAN_GENRES.map((genre) => {
            const isActive = selectedGenre === genre
            return (
              <Badge
                key={genre}
                variant={isActive ? 'default' : 'secondary'}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 select-none text-xs px-3 py-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-transparent shadow-lg shadow-purple-500/20'
                    : 'bg-white/[0.03] text-muted-foreground/80 border-border/30 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30'
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

        {selectedGenre && (
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <span className="text-sm text-muted-foreground/70">
              Выбран:{' '}
              <span className="text-foreground font-semibold text-gradient-primary">
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
