'use client'

import { AnimeDisplay as BaseAnimeDisplay } from './AnimeDisplay'

interface AnimeDisplayServerProps {
  animeId: number
  showFullInfo?: boolean
}

export function AnimeDisplayServer({ animeId, showFullInfo = false }: AnimeDisplayServerProps) {
  return <BaseAnimeDisplay animeId={animeId} showFullInfo={showFullInfo} />
}
