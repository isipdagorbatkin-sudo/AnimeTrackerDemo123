import { useEffect, useState } from 'react'
import type { AniListAnime } from './anilist/client'

interface RussianText {
  title: string
  description: string
}

type ShikimoriAnimeCandidate = {
  id?: number
  mal_id?: number
  myanimelist_id?: number
  name?: string
  russian?: string
  english?: string[]
  description?: string
  description_html?: string
}

const EMPTY_RUSSIAN_TEXT: RussianText = { title: '', description: '' }
const cache = new Map<string, RussianText>()
const pending = new Map<string, Promise<void>>()

function cacheKey(idMal: number, title: string): string {
  return `${idMal}:${title}`
}

function getAnimeCacheKey(anime: AniListAnime | null): string {
  if (!anime) return ''
  const queries = [...new Set([anime.title?.native, anime.title?.english, anime.title?.romaji].filter(Boolean) as string[])]
  return cacheKey(anime.idMal || anime.id || 0, queries.join('|'))
}

export function getRussianText(idMal: number, title = ''): RussianText | null {
  if (title) return cache.get(cacheKey(idMal, title)) || null

  const prefix = `${idMal}:`
  for (const [key, value] of cache.entries()) {
    if (key.startsWith(prefix)) return value
  }
  return null
}

export function setRussianCache(idMal: number, key: string, text: RussianText): void {
  cache.set(cacheKey(idMal, key), text)
}

let shikimoriAvailable = true
let lastShikimoriFail = 0
const SHIKIMORI_COOLDOWN = 30_000

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim()
}

function normalizeTitle(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function matchesTitle(anime: { name?: string; russian?: string; english?: string[] }, title: string): boolean {
  const query = normalizeTitle(title)
  if (!query) return false

  return [anime.name, anime.russian, ...(anime.english || [])]
    .map(normalizeTitle)
    .some(name => name === query || name.includes(query) || query.includes(name))
}

async function fetchRussianByShikimori(title: string, idMal: number): Promise<RussianText | null> {
  if (!shikimoriAvailable && Date.now() - lastShikimoriFail < SHIKIMORI_COOLDOWN) return null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    let match: ShikimoriAnimeCandidate | null = null

    if (idMal > 0) {
      const detailsRes = await fetch(`/api/shikimori/animes/${idMal}`, { signal: controller.signal })
      if (detailsRes.ok) {
        const details = await detailsRes.json().catch(() => null)
        if (details && Number(details.id) === idMal) match = details as ShikimoriAnimeCandidate
      }
    }

    if (!match && title) {
      const res = await fetch(`/api/shikimori/animes?search=${encodeURIComponent(title)}&limit=10`, { signal: controller.signal })
      if (!res.ok) {
        lastShikimoriFail = Date.now()
        if (res.status !== 404) shikimoriAvailable = false
        return null
      }

      const data = await res.json()
      if (!Array.isArray(data)) return null

      if (idMal > 0) {
        match = data.find((anime: { id?: number; mal_id?: number; myanimelist_id?: number }) => {
          const malId = Number(anime.myanimelist_id || anime.mal_id || anime.id || 0)
          return malId === idMal
        }) || null
      }

      if (!match) {
        match = data.find((anime: { name?: string; russian?: string; english?: string[] }) => matchesTitle(anime, title)) || null
      }
    }

    clearTimeout(timer)
    shikimoriAvailable = true

    if (!match) return null

    if (idMal > 0) {
      const candidateId = Number(match.myanimelist_id || match.mal_id || match.id || 0)
      if (candidateId !== idMal && !matchesTitle(match, title)) {
        return null
      }
    }

    if ((!match.description && !match.description_html) && match.id) {
      const detailsRes = await fetch(`/api/shikimori/animes/${match.id}`, { signal: controller.signal })
      if (detailsRes.ok) {
        const details = await detailsRes.json().catch(() => null)
        if (details) match = { ...match, ...(details as ShikimoriAnimeCandidate) }
      }
    }

    if (idMal > 0) {
      const malId = Number(match.myanimelist_id || match.mal_id || match.id || 0)
      if (malId !== idMal && !matchesTitle(match, title)) {
        return null
      }
    }

    return {
      title: match.russian || match.name || '',
      description: stripHtml(match.description || match.description_html || ''),
    }
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
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  processing = false
}

export function fetchRussianText(idMal: number, nameEn?: string, nameJp?: string, nameNative?: string): Promise<void> {
  const queries = [...new Set([nameEn, nameJp, nameNative].filter(Boolean) as string[])]
  const key = cacheKey(idMal, queries.join('|'))
  if (cache.has(key)) return Promise.resolve()
  if (pending.has(key)) return pending.get(key)!

  const promise = new Promise<void>((resolve) => {
    fetchQueue.push(async () => {
      try {
        for (const query of queries.length > 0 ? queries : ['']) {
          const shikiResult = await fetchRussianByShikimori(query, idMal)
          if (shikiResult && (shikiResult.title || shikiResult.description)) {
            cache.set(key, shikiResult)
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

export function useRussianText(anime: AniListAnime | null): RussianText {
  const [russianText, setRussianText] = useState<RussianText>(EMPTY_RUSSIAN_TEXT)
  const idMal = anime?.idMal
  const nameEn = anime?.title?.english
  const nameJp = anime?.title?.romaji
  const nameNative = anime?.title?.native

  useEffect(() => {
    if (!anime || (!idMal && !nameEn && !nameJp && !nameNative)) return

    const queries = [...new Set([nameEn, nameJp, nameNative].filter(Boolean) as string[])]
    const key = getAnimeCacheKey(anime)
    const cached = cache.get(key) || getRussianText(idMal || anime.id || 0, queries.join('|'))
    if (cached) {
      const timer = window.setTimeout(() => setRussianText(cached), 0)
      return () => window.clearTimeout(timer)
    }

    fetchRussianText(idMal || anime.id || 0, nameEn, nameJp, nameNative).then(() => {
      const result = cache.get(key) || getRussianText(idMal || anime.id || 0, queries.join('|'))
      if (result) setRussianText(result)
    })
  }, [anime, idMal, nameEn, nameJp, nameNative])

  return russianText
}

export function useRussianTitle(anime: AniListAnime | null): string {
  const russianText = useRussianText(anime)
  return russianText.title || anime?.title?.romaji || anime?.title?.english || anime?.title?.native || 'Без названия'
}
