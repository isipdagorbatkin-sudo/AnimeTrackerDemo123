const KODIK_API_BASE = '/api/kodik'
const KODIK_TYPES = 'anime,anime-serial'

export interface KodikAnime {
  id: string
  type: string
  link: string
  title: string
  title_orig: string
  other_title: string
  year: number
  screenshots: string[]
  shikimori_id?: string
  kinopoisk_id?: string
  imdb_id?: string
  quality?: string
  episodes_count?: number
  last_season?: number
  last_episode?: number
  translation?: {
    id: number
    title: string
    type: string
  }
  seasons?: Record<string, KodikSeason>
  material_data?: {
    title?: string
    anime_title?: string
    title_en?: string
    other_titles?: string[]
    anime_license_name?: string
    shikimori_rating?: number
    year?: number
  }
}

export type KodikEpisode = string | {
  link?: string
  title?: string
}

export interface KodikSeason {
  title?: string
  link: string
  episodes?: Record<string, KodikEpisode>
}

export interface KodikSearchResponse {
  time: string
  total: number
  results: KodikAnime[]
}

export interface JikanLikeAnime {
  mal_id: number
  title: string
  title_japanese: string
  synopsis: null
  images: {
    jpg: {
      large_image_url: string
      image_url: string
    }
  }
  genres: never[]
  score: null
  episodes?: number
  status: string
  type: string
  year: number
}

async function fetchKodik(params: URLSearchParams): Promise<KodikSearchResponse> {
  const response = await fetch(`${KODIK_API_BASE}/search?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Kodik API error: ${response.status}`)
  }

  return response.json()
}

export async function searchAnime(query: string, limit: number = 20): Promise<KodikSearchResponse> {
  try {
    const params = new URLSearchParams({
      title: query,
      types: KODIK_TYPES,
      limit: limit.toString(),
      with_material_data: 'true',
      with_seasons: 'true',
      with_episodes: 'true',
    })
    return await fetchKodik(params)
  } catch (error) {
    console.error('Error in searchAnime:', error)
    throw error
  }
}

export async function searchAnimeByShikimoriId(shikimoriId: number, limit: number = 50): Promise<KodikSearchResponse> {
  try {
    const params = new URLSearchParams({
      shikimori_id: shikimoriId.toString(),
      types: KODIK_TYPES,
      limit: limit.toString(),
      with_material_data: 'true',
      with_seasons: 'true',
      with_episodes: 'true',
    })
    return await fetchKodik(params)
  } catch (error) {
    console.error('Error in searchAnimeByShikimoriId:', error)
    throw error
  }
}

export function getKodikPlayerUrl(link?: string): string {
  if (!link) return ''
  if (link.startsWith('//')) return `https:${link}`
  if (link.startsWith('http://')) return link.replace('http://', 'https://')
  return link
}

export function convertToJikanFormat(anime: KodikAnime): JikanLikeAnime {
  return {
    mal_id: parseInt(anime.id.replace(/\D/g, '')) || parseInt(anime.id),
    title: anime.title,
    title_japanese: anime.title_orig,
    synopsis: null,
    images: {
      jpg: {
        large_image_url: anime.screenshots[0] || '',
        image_url: anime.screenshots[0] || '',
      },
    },
    genres: [],
    score: null,
    episodes: anime.episodes_count,
    status: anime.last_season && anime.last_episode ? 'completed' : 'ongoing',
    type: anime.type === 'anime' ? 'movie' : 'tv',
    year: anime.year,
  }
}
