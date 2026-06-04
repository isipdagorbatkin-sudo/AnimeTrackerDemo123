const KODIK_API_BASE = 'https://kodik-api.com'

// Получаем токен из документации (общедоступный)
const KODIK_TOKEN = '447d179e875efe44217f20d1ee2146be'

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
}

export interface KodikSearchResponse {
  time: string
  total: number
  results: KodikAnime[]
}

export async function searchAnime(query: string, limit: number = 20): Promise<KodikSearchResponse> {
  try {
    const response = await fetch(
      `${KODIK_API_BASE}/search?token=${KODIK_TOKEN}&title=${encodeURIComponent(query)}&types=anime,anime-serial&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Kodik API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Kodik search response:', data)

    return data
  } catch (error) {
    console.error('Error in searchAnime:', error)
    throw error
  }
}

export function convertToJikanFormat(anime: KodikAnime): any {
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
