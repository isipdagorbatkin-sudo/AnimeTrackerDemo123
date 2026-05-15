const KITSU_API = 'https://kitsu.io/api/edge'

export interface KitsuAnime {
  id: string
  type: string
  attributes: {
    slug: string
    canonicalTitle: string
    titles: {
      en?: string
      en_jp?: string
      ja_jp?: string
    }
    synopsis?: string
    averageRating?: string
    ratingRank?: number
    popularityRank?: number
    status: string
    posterImage: {
      tiny: string
      small: string
      medium: string
      large: string
      original: string
    }
    coverImage: {
      tiny: string
      small: string
      large: string
      original: string
    }
    episodeCount?: number
    subtype: string
    startDate?: string
    endDate?: string
    tba?: string
  }
  relationships: {
    categories: {
      data: Array<{
        id: string
        type: string
      }>
    }
  }
}

export interface KitsuSearchResponse {
  data: KitsuAnime[]
  meta: {
    count: number
  }
}

export async function searchAnime(query: string, page: number = 1): Promise<KitsuSearchResponse> {
  try {
    const offset = (page - 1) * 20
    const response = await fetch(
      `${KITSU_API}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=20&page[offset]=${offset}&sort=popularityRank`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Kitsu API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Kitsu search response:', data)

    return data
  } catch (error) {
    console.error('Error in searchAnime:', error)
    throw error
  }
}

export async function getAnimeById(id: string): Promise<KitsuAnime> {
  try {
    const response = await fetch(
      `${KITSU_API}/anime/${id}?include=categories`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Kitsu API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Kitsu getAnimeById response:', data)

    return data.data
  } catch (error) {
    console.error('Error in getAnimeById:', error)
    throw error
  }
}

export function convertToJikanFormat(anime: KitsuAnime): any {
  return {
    mal_id: parseInt(anime.id),
    title: anime.attributes.canonicalTitle || anime.attributes.titles.en || anime.attributes.titles.en_jp || 'Без названия',
    title_japanese: anime.attributes.titles.ja_jp,
    synopsis: anime.attributes.synopsis,
    images: {
      jpg: {
        large_image_url: anime.attributes.posterImage.large || anime.attributes.posterImage.original,
        image_url: anime.attributes.posterImage.medium || anime.attributes.posterImage.small,
      },
    },
    genres: [], // Kitsu использует categories, но это требует дополнительного запроса
    score: anime.attributes.averageRating ? parseFloat(anime.attributes.averageRating) / 10 : null,
    episodes: anime.attributes.episodeCount,
    status: anime.attributes.status,
    type: anime.attributes.subtype,
    year: anime.attributes.startDate ? new Date(anime.attributes.startDate).getFullYear() : null,
  }
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'current': 'Выходит',
    'finished': 'Завершено',
    'tba': 'Скоро',
    'unreleased': 'Скоро',
    'upcoming': 'Скоро',
  }
  return statusMap[status] || status
}

export function getTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    'TV': 'ТВ',
    'movie': 'Фильм',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'special': 'Спец.',
  }
  return typeMap[type] || type
}
