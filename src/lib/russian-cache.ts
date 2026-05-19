import { useState, useEffect } from 'react'
import type { AniListAnime } from './anilist/client'

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

export function setRussianCache(idMal: number, key: string, text: RussianText): void {
  cache.set(cacheKey(idMal, key), text)
}

let shikimoriAvailable = true
let lastShikimoriFail = 0
const SHIKIMORI_COOLDOWN = 30_000

async function fetchRussianByShikimori(title: string, idMal: number): Promise<{ title: string; description: string } | null> {
  if (!shikimoriAvailable && Date.now() - lastShikimoriFail < SHIKIMORI_COOLDOWN) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`/api/shikimori/animes?search=${encodeURIComponent(title)}&limit=10`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) {
      lastShikimoriFail = Date.now()
      if (res.status !== 404) shikimoriAvailable = false
      return null
    }
    shikimoriAvailable = true
    const data = await res.json()
    if (!Array.isArray(data)) return null
    const match = data.find((a: any) => a.myanimelist_id === idMal)
    if (match) {
      return {
        title: match.russian || '',
        description: (match.description || '').replace(/<[^>]+>/g, ''),
      }
    }
    return null
  } catch {
    lastShikimoriFail = Date.now()
    shikimoriAvailable = false
    return null
  }
}

const fetchQueue: Array<() => Promise<void>> = []
let processing = false

async function processQueue() {
  if (processing || fetchQueue.length === 0) return
  processing = true
  while (fetchQueue.length > 0) {
    const task = fetchQueue.shift()
    if (task) await task()
    await new Promise(r => setTimeout(r, 150))
  }
  processing = false
}

export function fetchRussianText(idMal: number, nameEn?: string, nameJp?: string, nameNative?: string, year?: number | null): Promise<void> {
  const queries = [...new Set([nameNative, nameEn, nameJp].filter(Boolean) as string[])]
  const key = cacheKey(idMal, queries.join('|'))
  if (cache.has(key)) return Promise.resolve()
  if (pending.has(key)) return pending.get(key)!
  const promise = new Promise<void>((resolve) => {
    fetchQueue.push(async () => {
      try {
        for (const q of queries) {
          const result = await fetchRussianByShikimori(q, idMal)
          if (result && result.title) {
            cache.set(key, result)
            break
          }
        }
      } finally {
        pending.delete(key)
        resolve()
      }
    })
    processQueue()
  })
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

  useEffect(() => {
    if (!idMal && !nameEn && !nameJp && !nameNative) return
    const queries = [...new Set([nameNative, nameEn, nameJp].filter(Boolean) as string[])]
    const key = cacheKey(idMal || 0, queries.join('|'))
    const cached = getRussianText(idMal || 0, queries.join('|'))
    if (cached) { setRussianTitle(cached.title); return }
    fetchRussianText(idMal || 0, nameEn, nameJp, nameNative, year).then(() => {
      const r = getRussianText(idMal || 0, queries.join('|'))
      if (r) setRussianTitle(r.title)
    })
  }, [idMal, nameEn, nameJp, nameNative, year])

  return russianTitle || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Без названия'
}
