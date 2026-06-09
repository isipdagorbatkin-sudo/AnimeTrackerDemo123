const ANILIBRIA_API = 'https://anilibria.top/api/v1'
const ANILIBRIA_ORIGIN = 'https://anilibria.top'

export interface AnilibriaName {
  main?: string | null
  english?: string | null
  alternative?: string | null
}

export interface AnilibriaEpisode {
  id: string
  name?: string | null
  name_english?: string | null
  ordinal: number
  hls_480?: string | null
  hls_720?: string | null
  hls_1080?: string | null
  duration?: number | null
  sort_order?: number | null
}

export interface AnilibriaRelease {
  id: number
  alias: string
  year?: number | null
  name: AnilibriaName
  episodes_total?: number | null
  external_player?: string | null
  is_blocked_by_geo?: boolean
  is_blocked_by_copyrights?: boolean
  episodes?: AnilibriaEpisode[]
  match_score?: number
}

export interface AnilibriaSearchResult {
  release: AnilibriaRelease
  alternatives: AnilibriaRelease[]
}

function normalizeTitle(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\b(tv|ova|ona|movie|season|part|серия|сезон|фильм)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function releaseTitles(release: AnilibriaRelease): string[] {
  return [
    release.name?.main,
    release.name?.english,
    release.name?.alternative,
    release.alias?.replace(/-/g, ' '),
  ].filter(Boolean) as string[]
}

function scoreRelease(release: AnilibriaRelease, queries: string[], expectedYear: number | null, expectedEpisodes: number | null): number {
  const normalizedQueries = queries.map(normalizeTitle).filter(Boolean)
  const normalizedTitles = releaseTitles(release).map(normalizeTitle).filter(Boolean)
  let score = 0

  for (const query of normalizedQueries) {
    for (const title of normalizedTitles) {
      if (!query || !title) continue
      if (title === query) score += 120
      else if (title.includes(query) || query.includes(title)) {
        const shorter = Math.min(title.length, query.length)
        const longer = Math.max(title.length, query.length)
        score += shorter / longer > 0.58 ? 60 : 20
      }
    }
  }

  if (expectedYear && release.year) {
    const diff = Math.abs(expectedYear - release.year)
    if (diff === 0) score += 40
    else if (diff === 1) score += 15
    else score -= 25
  }

  if (expectedEpisodes && release.episodes_total) {
    const diff = Math.abs(expectedEpisodes - release.episodes_total)
    if (diff === 0) score += 35
    else if (diff <= 2) score += 12
    else score -= Math.min(35, diff)
  }

  if (release.is_blocked_by_geo || release.is_blocked_by_copyrights) score -= 120
  if (release.external_player) score += 12

  return score
}

function absolutizePlayerUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('//')) return `https:${url}`
  if (url.startsWith('/')) return `${ANILIBRIA_ORIGIN}${url}`
  return url
}

function cleanRelease(release: AnilibriaRelease): AnilibriaRelease {
  return {
    id: release.id,
    alias: release.alias,
    year: release.year,
    name: release.name,
    episodes_total: release.episodes_total,
    external_player: absolutizePlayerUrl(release.external_player),
    is_blocked_by_geo: release.is_blocked_by_geo,
    is_blocked_by_copyrights: release.is_blocked_by_copyrights,
    match_score: release.match_score,
    episodes: (release.episodes || [])
      .filter((episode) => episode.hls_480 || episode.hls_720 || episode.hls_1080)
      .map((episode) => ({
        id: episode.id,
        name: episode.name,
        name_english: episode.name_english,
        ordinal: episode.ordinal,
        hls_480: episode.hls_480,
        hls_720: episode.hls_720,
        hls_1080: episode.hls_1080,
        duration: episode.duration,
        sort_order: episode.sort_order,
      }))
      .sort((a, b) => (a.sort_order || a.ordinal) - (b.sort_order || b.ordinal)),
  }
}

function cleanAlternative(release: AnilibriaRelease): AnilibriaRelease {
  return {
    id: release.id,
    alias: release.alias,
    year: release.year,
    name: release.name,
    episodes_total: release.episodes_total,
    external_player: absolutizePlayerUrl(release.external_player),
    is_blocked_by_geo: release.is_blocked_by_geo,
    is_blocked_by_copyrights: release.is_blocked_by_copyrights,
    match_score: release.match_score,
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${ANILIBRIA_API}${path}`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'AnimeTracker/1.0 (+https://animetrackers.vercel.app)',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`AniLibria HTTP ${res.status}`)
  return res.json()
}

export async function searchAnilibria(params: {
  titles: string[]
  year?: number | null
  episodes?: number | null
}): Promise<AnilibriaSearchResult | null> {
  const queries = [...new Set(params.titles.map((title) => title.trim()).filter(Boolean))]
  const batches = await Promise.all(
    queries.slice(0, 5).map(async (query) => {
      try {
        return await fetchJson<AnilibriaRelease[]>(`/app/search/releases?query=${encodeURIComponent(query)}`)
      } catch {
        return []
      }
    })
  )

  const seen = new Set<number>()
  const candidates = batches
    .flat()
    .filter((release) => {
      if (!release?.id || seen.has(release.id)) return false
      seen.add(release.id)
      return true
    })
    .map((release) => ({
      ...release,
      match_score: scoreRelease(release, queries, params.year || null, params.episodes || null),
    }))
    .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))

  const best = candidates[0]
  if (!best || (best.match_score || 0) < 45) return null

  const detailed = await fetchJson<AnilibriaRelease>(`/anime/releases/${best.alias || best.id}`)
  const release = cleanRelease({
    ...detailed,
    match_score: best.match_score,
  })

  if (!release.episodes?.length) return null
  return {
    release,
    alternatives: candidates.slice(0, 8).map(cleanAlternative),
  }
}
