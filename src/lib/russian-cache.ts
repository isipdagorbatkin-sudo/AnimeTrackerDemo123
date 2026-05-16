import { useState, useEffect } from 'react'
import type { AniListAnime } from './anilist/client'

const KODIK_TOKEN = '56a768d08f43091901c44b54fe970049'
const KODIK_API = 'https://kodik-api.com/search'

interface RussianText {
  title: string
  description: string
}

const cache = new Map<string, RussianText>()
const pending = new Map<string, Promise<void>>()

function cacheKey(idMal: number, title: string): string {
  return `${idMal}:${title}`
}

export function getRussianText(idMal: number, title: string): RussianText | null {
  return cache.get(cacheKey(idMal, title)) || null
}

async function fetchKodik(title: string, year?: number | null, episodes?: number | null): Promise<{ title: string; description: string } | null> {
  try {
    const res = await fetch(`${KODIK_API}?token=${KODIK_TOKEN}&title=${encodeURIComponent(title)}&limit=20&with_material_data=true`, {
      method: 'POST',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results || data.results.length === 0) return null

    if (year) {
      const byYear = data.results.filter((item: any) => item.material_data?.year === year)
      if (byYear.length > 0) {
        if (episodes && byYear.length > 1) {
          const byEpisodes = byYear.filter((item: any) => item.material_data?.episodes_total === episodes)
          if (byEpisodes.length > 0) {
            const item = byEpisodes[0]
            return {
              title: item.title || '',
              description: item.material_data?.description || '',
            }
          }
        }
        const item = byYear[0]
        return {
          title: item.title || '',
          description: item.material_data?.description || '',
        }
      }
    }

    const item = data.results[0]
    return {
      title: item.title || '',
      description: item.material_data?.description || '',
    }
  } catch {
    return null
  }
}

export function fetchRussianText(idMal: number, nameEn?: string, nameJp?: string, nameNative?: string, year?: number | null, episodes?: number | null): Promise<void> {
  const queries = [...new Set([nameNative, nameEn, nameJp].filter(Boolean) as string[])]
  const key = cacheKey(idMal, queries.join('|'))
  if (cache.has(key)) return Promise.resolve()
  if (pending.has(key)) return pending.get(key)!
  const promise = (async () => {
    try {
      for (const q of queries) {
        const result = await fetchKodik(q, year, episodes)
        if (result && result.title) {
          cache.set(key, result)
          return
        }
      }
    } finally {
      pending.delete(key)
    }
  })()
  pending.set(key, promise)
  return promise
}

export function useRussianTitle(anime: AniListAnime | null): string {
  const [russianTitle, setRussianTitle] = useState('')
  const idMal = anime?.idMal
  const nameEn = anime?.title?.english
  const nameJp = anime?.title?.romaji
  const nameNative = anime?.title?.native
  const year = anime?.startDate?.year
  const episodes = anime?.episodes

  useEffect(() => {
    if (!idMal && !nameEn && !nameJp && !nameNative) return
    const queries = [...new Set([nameNative, nameEn, nameJp].filter(Boolean) as string[])]
    const key = cacheKey(idMal || 0, queries.join('|'))
    const cached = getRussianText(idMal || 0, queries.join('|'))
    if (cached) { setRussianTitle(cached.title); return }
    fetchRussianText(idMal || 0, nameEn, nameJp, nameNative, year, episodes).then(() => {
      const r = getRussianText(idMal || 0, queries.join('|'))
      if (r) setRussianTitle(r.title)
    })
  }, [idMal, nameEn, nameJp, nameNative, year, episodes])

  return russianTitle || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Без названия'
}
