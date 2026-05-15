import { useState, useEffect } from 'react'
import { searchAnime as shikiSearch } from './shikimori/client'
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

export function fetchRussianText(idMal: number, nameEn?: string, nameJp?: string): Promise<void> {
  if (cache.has(idMal)) return Promise.resolve()
  if (pending.has(idMal)) return pending.get(idMal)!
  const promise = (async () => {
    try {
      let shiki: any = null
      const queries = [nameEn, nameJp].filter(Boolean) as string[]
      for (const q of queries) {
        try {
          const results = await shikiSearch(q, 1, 10)
          shiki = results.find(a => a.mal_id === idMal) || null
          if (shiki) break
          shiki = results[0] || null
          if (shiki) break
        } catch { }
      }
      if (shiki && shiki.russian) {
        cache.set(idMal, {
          title: shiki.russian,
          description: (shiki.description_html || shiki.synopsis || '').replace(/<[^>]*>/g, ''),
        })
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
  const nameEn = anime?.title?.english
  const nameJp = anime?.title?.romaji

  useEffect(() => {
    if (!idMal) return
    const cached = getRussianText(idMal)
    if (cached) { setRussianTitle(cached.title); return }
    fetchRussianText(idMal, nameEn, nameJp).then(() => {
      const r = getRussianText(idMal)
      if (r) setRussianTitle(r.title)
    })
  }, [idMal, nameEn, nameJp])

  return russianTitle || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Без названия'
}
