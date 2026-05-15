const ANIXART_API_BASE = 'https://api.anixart.tv'

export interface AnixartAnime {
  id: number
  title: {
    ru: string
    en: string
    original: string
  }
  poster: {
    original: string
    medium: string
    small: string
  }
  description: string
  genres: string[]
  status: string
  type: string
  year: number
  rating: number
  episodes: {
    current: number
    total: number
  }
  studio: string
  country: string
}

export interface AnixartSearchResponse {
  data: AnixartAnime[]
  pagination: {
    current_page: number
    total_pages: number
    total_items: number
  }
}

export async function searchAnime(query: string, page: number = 1): Promise<AnixartSearchResponse> {
  try {
    const response = await fetch(
      `${ANIXART_API_BASE}/release/search?query=${encodeURIComponent(query)}&page=${page}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Anixart API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Anixart search response:', data)

    return data
  } catch (error) {
    console.error('Error in searchAnime:', error)
    throw error
  }
}

export async function getAnimeById(id: number): Promise<AnixartAnime | null> {
  try {
    const response = await fetch(
      `${ANIXART_API_BASE}/release?id=${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Anixart API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Anixart anime by ID response:', data)

    return data
  } catch (error) {
    console.error('Error in getAnimeById:', error)
    return null
  }
}

export function convertToJikanFormat(anime: AnixartAnime): any {
  return {
    mal_id: anime.id,
    title: anime.title.ru || anime.title.en,
    title_japanese: anime.title.original,
    synopsis: anime.description,
    images: {
      jpg: {
        large_image_url: anime.poster.original,
        image_url: anime.poster.medium,
      },
    },
    genres: anime.genres.map((name, index) => ({
      mal_id: index,
      name: name,
    })),
    score: anime.rating ? anime.rating / 10 : null,
    episodes: anime.episodes.total,
    status: anime.status,
    type: anime.type,
    year: anime.year,
  }
}
