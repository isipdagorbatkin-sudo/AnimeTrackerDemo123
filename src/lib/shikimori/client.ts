const SHIKIMORI_API_BASE = 'https://shikimori.one/api'

export interface ShikimoriAnime {
  id: number
  name: string
  russian: string
  name_synonyms: string[]
  english: string[]
  japanese: string[]
  synopsis: string
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

export interface ShikimoriSearchResponse {
  [key: number]: ShikimoriAnime
}

export async function searchAnime(query: string, limit: number = 20): Promise<ShikimoriAnime[]> {
  try {
    const response = await fetch(
      `${SHIKIMORI_API_BASE}/animes/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Shikimori API error: ${response.status}`)
    }

    const data: ShikimoriSearchResponse = await response.json()
    console.log('Shikimori search response:', data)

    // Преобразуем объект в массив
    return Object.values(data)
  } catch (error) {
    console.error('Error in searchAnime:', error)
    throw error
  }
}

export async function getAnimeById(id: number): Promise<ShikimoriAnime | null> {
  try {
    const response = await fetch(
      `${SHIKIMORI_API_BASE}/animes/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Shikimori API error: ${response.status}`)
    }

    const data: ShikimoriAnime = await response.json()
    console.log('Shikimori anime by ID response:', data)

    return data
  } catch (error) {
    console.error('Error in getAnimeById:', error)
    return null
  }
}

export function convertToJikanFormat(anime: ShikimoriAnime): any {
  return {
    mal_id: anime.id,
    title: anime.russian || anime.name,
    title_japanese: anime.japanese[0] || null,
    synopsis: anime.synopsis,
    images: {
      jpg: {
        large_image_url: anime.image.original,
        image_url: anime.image.preview,
      },
    },
    genres: anime.genres.map((genre) => ({
      mal_id: genre.id,
      name: genre.russian || genre.name,
    })),
    score: anime.score,
    episodes: anime.episodes,
    status: anime.status,
    type: anime.kind,
    year: anime.aired_on ? new Date(anime.aired_on).getFullYear() : null,
  }
}
