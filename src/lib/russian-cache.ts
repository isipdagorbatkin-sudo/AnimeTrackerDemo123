import { useState, useEffect } from 'react'
import { getAnimeByMalId, searchAnime as shikiSearch } from './shikimori/client'
import type { AniListAnime } from './anilist/client'

interface RussianText {
  title: string
  description: string
}

const cache = new Map<number, RussianText>()
const pending = new Map<number, Promise<void>>()

export function getRussianText(idMal: number): RussianText | null {
  return cache.get(idMal) || null
}

export function fetchRussianText(idMal: number, nameHint?: string): Promise<void> {
  if (cache.has(idMal)) return Promise.resolve()
  if (pending.has(idMal)) return pending.get(idMal)!
  const promise = (async () => {
    try {
      let shiki: any = null
      if (nameHint) {
        const results = await shikiSearch(nameHint, 1, 10)
        shiki = results.find(a => a.mal_id === idMal) || null
      }
      if (!shiki) {
        shiki = await getAnimeByMalId(idMal)
        if (shiki && shiki.mal_id !== idMal) shiki = null
      }
      if (shiki) {
        cache.set(idMal, { title: shiki.russian || '', description: (shiki.description_html || shiki.synopsis || '').replace(/<[^>]*>/g, '') })
      }
    } finally {
      pending.delete(idMal)
    }
  })()
  pending.set(idMal, promise)
  return promise
}

export function useRussianTitle(anime: AniListAnime | null): string {
  const [russianTitle, setRussianTitle] = useState('')
  const idMal = anime?.idMal
  const nameHint = anime?.title?.romaji

  useEffect(() => {
    if (!idMal) return
    const cached = getRussianText(idMal)
    if (cached) { setRussianTitle(cached.title); return }
    fetchRussianText(idMal, nameHint).then(() => {
      const r = getRussianText(idMal)
      if (r) setRussianTitle(r.title)
    })
  }, [idMal, nameHint])

  return russianTitle || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Без названия'
}
