const SHIKIMORI_BASE = '/api/shikimori'

export interface ShikimoriAnime {
  id: number
  mal_id: number | null
  name: string
  russian: string
  name_synonyms: string[]
  english: string[]
  japanese: string[]
  synopsis: string
  description_html: string
  score: number
  kind: string
  status: string
  episodes: number
  episodes_aired: number
  aired_on: string
  released_on: string
  rating: string
  genres: Array<{
    id: number
    name: string
    russian: string
    kind: string
  }>
  studios: Array<{
    id: number
    name: string
    filtered: string
  }>
  image: {
    original: string
    preview: string
    x96: string
    x48: string
  }
}

async function fetchShikimori<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${SHIKIMORI_BASE}${endpoint}`, {
    headers: { 'Accept': 'application/json' },
  })
  if (!response.ok) throw new Error(`Shikimori API error: ${response.status}`)
  return response.json()
}

function normalizeAnime(a: any): ShikimoriAnime {
  const rawMalId = a.mal_id ?? a.myanimelist_id ?? null
  return {
    ...a,
    score: typeof a.score === 'number' ? a.score : parseFloat(a.score) || 0,
    episodes: typeof a.episodes === 'number' ? a.episodes : parseInt(a.episodes) || 0,
    episodes_aired: typeof a.episodes_aired === 'number' ? a.episodes_aired : parseInt(a.episodes_aired) || 0,
    id: typeof a.id === 'number' ? a.id : parseInt(a.id) || 0,
    mal_id: rawMalId != null ? (typeof rawMalId === 'number' ? rawMalId : parseInt(rawMalId) || null) : null,
  }
}

async function fetchAnimeList(endpoint: string): Promise<ShikimoriAnime[]> {
  const data = await fetchShikimori<any[]>(endpoint)
  return (data || []).map(normalizeAnime)
}

async function fetchSingleAnime(endpoint: string): Promise<ShikimoriAnime | null> {
  try {
    const data = await fetchShikimori<any>(endpoint)
    return data ? normalizeAnime(data) : null
  } catch {
    return null
  }
}

export async function searchAnime(query: string, page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    search: query,
    page: page.toString(),
    limit: limit.toString(),
  })
  return fetchAnimeList(`/animes?${params}`)
}

export async function getAnimeById(id: number): Promise<ShikimoriAnime | null> {
  return fetchSingleAnime(`/animes/${id}`)
}

export async function getAnimeByMalId(malId: number): Promise<ShikimoriAnime | null> {
  try {
    const list = await fetchAnimeList(`/animes?myanimelist_id=${malId}`)
    return list[0] || null
  } catch {
    return null
  }
}

export async function getTopAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    order: 'ranked',
  })
  return fetchAnimeList(`/animes?${params}`)
}

export async function getAiringAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'ongoing',
    order: 'popularity',
  })
  return fetchAnimeList(`/animes?${params}`)
}

export async function getUpcomingAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'anons',
    order: 'popularity',
  })
  return fetchAnimeList(`/animes?${params}`)
}

export async function getReleasedAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'released',
    order: 'popularity',
  })
  return fetchAnimeList(`/animes?${params}`)
}

export async function getMovies(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    kind: 'movie',
    order: 'popularity',
  })
  return fetchAnimeList(`/animes?${params}`)
}

export async function getAnimeByGenre(genreId: string, page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    genre: genreId,
    order: 'popularity',
  })
  return fetchAnimeList(`/animes?${params}`)
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    anons: 'Анонс',
    ongoing: 'Выходит',
    released: 'Завершено',
  }
  return map[status] || status
}

export function getFullImageUrl(path: string): string {
  if (!path) return ''
  return path.startsWith('/') ? `https://shikimori.one${path}` : path
}

export interface ShikimoriScreenshot {
  id: number
  image: string
}

export interface ShikimoriEpisode {
  id: number
  number: number
  title: string
  aired_on: string | null
  episodes: number
}

export async function getAnimeScreenshots(animeId: number): Promise<string[]> {
  try {
    const data = await fetchShikimori<any[]>(`/animes/${animeId}/screenshots`)
    return (data || []).map((s: any) => getFullImageUrl(s.image?.original || s.image?.preview || ''))
  } catch {
    return []
  }
}

export async function getAnimeEpisodes(animeId: number): Promise<ShikimoriEpisode[]> {
  try {
    const data = await fetchShikimori<any[]>(`/animes/${animeId}/episodes`)
    return (data || []).map((e: any) => ({
      id: e.id,
      number: e.number,
      title: e.title || `Эпизод ${e.number}`,
      aired_on: e.aired_on || null,
      episodes: e.episodes || 0,
    }))
  } catch {
    return []
  }
}

export async function getSimilarAnime(animeId: number): Promise<ShikimoriAnime[]> {
  try {
    const data = await fetchShikimori<any[]>(`/animes/${animeId}/similar`)
    return (data || []).map(normalizeAnime)
  } catch {
    return []
  }
}
  const map: Record<string, string> = {
    tv: 'ТВ',
    movie: 'Фильм',
    ova: 'OVA',
    ona: 'ONA',
    special: 'Спец.',
    tv_13: 'ТВ (13+)',
    tv_24: 'ТВ (24+)',
    tv_48: 'ТВ (48+)',
  }
  return map[kind] || kind
}
