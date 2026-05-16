export function normalizeSearchQuery(value: string): string {
  return value.trim()
}

export function hasCyrillic(value: string): boolean {
  return /[а-яё]/i.test(value)
}

const translitMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export function transliterateRuToLat(value: string): string {
  const lower = value.toLowerCase()
  let result = ''
  for (const char of lower) {
    result += translitMap[char] ?? char
  }
  return result
}

export function buildSearchCandidates(query: string): string[] {
  const cleaned = normalizeSearchQuery(query)
  if (!cleaned) return []
  if (!hasCyrillic(cleaned)) return [cleaned]
  const translit = transliterateRuToLat(cleaned)
  const candidates = [translit, cleaned].filter((value, index, array) => {
    return value && array.indexOf(value) === index
  })
  return candidates.length > 0 ? candidates : [cleaned]
}

import { searchAnime } from './anilist/client'
import type { AniListAnime } from './anilist/client'
import { searchKodik } from './kodik/client'

export async function searchWithRussian(query: string, page = 1, perPage = 20): Promise<{ media: AniListAnime[]; hasMore: boolean }> {
  const candidates = buildSearchCandidates(query)
  const anilistResults = await Promise.all(
    candidates.map(c => searchAnime(c, page, perPage).then(r => r.Page?.media || []))
  )
  const seen = new Set<number>()
  const allMedia = anilistResults.flat()
  const deduped = allMedia.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })
  const hasMore = deduped.length >= perPage

  if (hasCyrillic(query) || deduped.length < 3) {
    try {
      const kodikResults = await searchKodik(query)
      if (kodikResults.length > 0) {
        const kodikTitles = [...new Set(kodikResults.map(r => r.title_orig || r.title).filter(Boolean))] as string[]
        const kodikSearchResults = await Promise.all(
          kodikTitles.map(t => searchAnime(t, 1, 5).then(r => r.Page?.media || []))
        )
        for (const a of kodikSearchResults.flat()) {
          if (!seen.has(a.id)) {
            deduped.push(a)
            seen.add(a.id)
          }
        }
      }
    } catch {}
  }

  return { media: deduped, hasMore }
}
