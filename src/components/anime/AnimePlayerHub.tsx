'use client'

import { YummyPlayer } from '@/components/anime/YummyPlayer'

interface AnimePlayerHubProps {
  animeTitle: string
  fallbackTitles?: string[]
  idMal?: number | null
  year?: number | null
  episodes?: number | null
}

export function AnimePlayerHub(props: AnimePlayerHubProps) {
  return <YummyPlayer {...props} />
}
