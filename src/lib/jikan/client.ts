import { JikanAnime, JikanSearchResponse, JikanErrorResponse } from './types'

const JIKAN_API_BASE = '/api/jikan'

export class JikanError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'JikanError'
  }
}

async function fetchJikan<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${JIKAN_API_BASE}${endpoint}`)

    if (!response.ok) {
      const error: JikanErrorResponse = await response.json()
      throw new JikanError(error.message || 'Ошибка Jikan API', error.status)
    }

    return response.json()
  } catch (error) {
    if (error instanceof JikanError) {
      throw error
    }
    throw new JikanError('Не удалось подключиться к Jikan API')
  }
}

export async function searchAnime(query: string, page = 1, limit = 20): Promise<JikanSearchResponse> {
  if (!query.trim()) {
    throw new JikanError('Поисковый запрос не может быть пустым')
  }

  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: limit.toString(),
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export async function getAnimeById(id: number): Promise<JikanAnime> {
  const response = await fetchJikan<{ data: JikanAnime }>(`/anime/${id}/full`)
  return response.data
}

export async function getTopAnime(page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  return fetchJikan<JikanSearchResponse>(`/top/anime?${params.toString()}`)
}

export async function getAiringAnime(page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'airing',
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export async function getUpcomingAnime(page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'upcoming',
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export async function getCompletedAnime(page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: 'complete',
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export async function getMovies(page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    type: 'movie',
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export async function getAnimeByGenre(genre: string, page = 1, limit = 20): Promise<JikanSearchResponse> {
  const params = new URLSearchParams({
    genres: genre,
    page: page.toString(),
    limit: limit.toString(),
    order_by: 'score',
    sort: 'desc',
    sfw: 'true',
  })

  return fetchJikan<JikanSearchResponse>(`/anime?${params.toString()}`)
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'Airing': 'Выходит',
    'Complete': 'Завершено',
    'Upcoming': 'Анонс',
    'Finished Airing': 'Завершено',
  }
  return statusMap[status] || status
}

export function getTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    'TV': 'ТВ',
    'TV Short': 'ТВ (короткий)',
    'Movie': 'Фильм',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'Special': 'Спец.',
    'Music': 'Музыка',
    'Unknown': 'Неизвестно',
  }
  return typeMap[type] || type
}
