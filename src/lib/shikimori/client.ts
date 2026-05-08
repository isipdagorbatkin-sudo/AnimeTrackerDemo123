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

export async function searchAnime(query: string, page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    search: query,
    page: page.toString(),
    limit: limit.toString(),
  })
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export async function getAnimeById(id: number): Promise<ShikimoriAnime | null> {
  try {
    return await fetchShikimori<ShikimoriAnime>(`/animes/${id}`)
  } catch {
    return null
  }
}

export async function getAnimeByMalId(malId: number): Promise<ShikimoriAnime | null> {
  try {
    const list = await fetchShikimori<ShikimoriAnime[]>(`/animes?myanimelist_id=${malId}`)
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
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export async function getAiringAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'ongoing',
    order: 'popularity',
  })
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export async function getUpcomingAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'anons',
    order: 'popularity',
  })
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export async function getReleasedAnime(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'released',
    order: 'popularity',
  })
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export async function getMovies(page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    kind: 'movie',
    order: 'popularity',
  })
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export async function getAnimeByGenre(genreId: string, page = 1, limit = 20): Promise<ShikimoriAnime[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    genre: genreId,
    order: 'popularity',
  })
  return fetchShikimori<ShikimoriAnime[]>(`/animes?${params}`)
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    anons: 'Анонс',
    ongoing: 'Выходит',
    released: 'Завершено',
  }
  return map[status] || status
}

export function getTypeText(kind: string): string {
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
