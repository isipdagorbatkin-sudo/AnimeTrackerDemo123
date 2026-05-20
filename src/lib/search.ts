import { getAnimeByMalId, searchAnime } from './anilist/client'
import type { AniListAnime } from './anilist/client'

type ShikimoriSearchItem = {
  id?: number
  mal_id?: number | string | null
  myanimelist_id?: number | string | null
  name?: string
  russian?: string
  english?: string[]
  aired_on?: string | null
  score?: string | number | null
}

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function hasCyrillic(value: string): boolean {
  return /[\u0400-\u04ff]/i.test(value)
}

const translitMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

export function transliterateRuToLat(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((char) => translitMap[char] ?? char)
    .join('')
}

export function buildSearchCandidates(query: string): string[] {
  const cleaned = normalizeSearchQuery(query)
  if (!cleaned) return []

  const candidates = [cleaned]
  if (hasCyrillic(cleaned)) {
    candidates.push(transliterateRuToLat(cleaned))
  }

  return [...new Set(candidates.filter(Boolean))]
}

function getShikimoriMalId(item: ShikimoriSearchItem): number | null {
  const raw = item.mal_id ?? item.myanimelist_id ?? item.id ?? null
  if (raw == null) return null
  const id = typeof raw === 'number' ? raw : parseInt(raw, 10)
  return Number.isFinite(id) && id > 0 ? id : null
}

function getShikimoriYear(item: ShikimoriSearchItem): number {
  if (!item.aired_on) return 0
  const year = parseInt(item.aired_on.slice(0, 4), 10)
  return Number.isFinite(year) ? year : 0
}

function normalizeForMatch(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function rankShikimori(item: ShikimoriSearchItem, query: string): number {
  const normalizedQuery = normalizeForMatch(query)
  const names = [item.russian, item.name, ...(item.english || [])]
    .map(normalizeForMatch)
    .filter(Boolean)

  let score = 0
  for (const name of names) {
    if (name === normalizedQuery) score += 100
    else if (name.includes(normalizedQuery) || normalizedQuery.includes(name)) score += 45
  }

  const rating = typeof item.score === 'number' ? item.score : parseFloat(item.score || '0')
  if (Number.isFinite(rating)) score += rating

  const year = getShikimoriYear(item)
  if (year) score += Math.min(10, Math.max(0, year - 1990) / 4)

  return score
}

async function searchShikimori(query: string, limit: number): Promise<ShikimoriSearchItem[]> {
  try {
    const params = new URLSearchParams({
      search: query,
      limit: String(limit),
      order: 'popularity',
    })
    const res = await fetch(`/api/shikimori/animes?${params.toString()}`)
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.sort((a, b) => rankShikimori(b, query) - rankShikimori(a, query))
  } catch {
    return []
  }
}

function appendUnique(target: AniListAnime[], seen: Set<number>, items: AniListAnime[]) {
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    target.push(item)
  }
}

async function searchAniListCandidates(candidates: string[], page: number, perPage: number): Promise<AniListAnime[]> {
  const batches = await Promise.all(
    candidates.map((candidate) =>
      searchAnime(candidate, page, perPage)
        .then((response) => response.Page?.media || [])
        .catch(() => [])
    )
  )
  return batches.flat()
}

async function searchAniListByShikimori(query: string, perPage: number): Promise<AniListAnime[]> {
  const shikimoriResults = await searchShikimori(query, Math.max(10, perPage))
  const malIds = [...new Set(shikimoriResults.map(getShikimoriMalId).filter(Boolean) as number[])]
  const exactMatches = await Promise.all(malIds.map((id) => getAnimeByMalId(id)))
  return exactMatches.filter(Boolean) as AniListAnime[]
}

export async function searchWithRussian(query: string, page = 1, perPage = 20): Promise<{ media: AniListAnime[]; hasMore: boolean }> {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return { media: [], hasMore: false }

  const seen = new Set<number>()
  const media: AniListAnime[] = []

  if (hasCyrillic(normalizedQuery) && page === 1) {
    appendUnique(media, seen, await searchAniListByShikimori(normalizedQuery, perPage))
  }

  appendUnique(media, seen, await searchAniListCandidates(buildSearchCandidates(normalizedQuery), page, perPage))

  if (!hasCyrillic(normalizedQuery) && media.length < Math.min(3, perPage) && page === 1) {
    appendUnique(media, seen, await searchAniListByShikimori(normalizedQuery, perPage))
  }

  return {
    media: media.slice(0, perPage),
    hasMore: media.length > perPage || (!hasCyrillic(normalizedQuery) && media.length >= perPage),
  }
}
