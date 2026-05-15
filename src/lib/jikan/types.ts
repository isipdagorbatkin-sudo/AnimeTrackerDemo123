export interface JikanAnime {
  mal_id: number
  url: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
    webp: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  title: string
  title_english: string | null
  title_japanese: string | null
  title_synonyms: string[]
  titles: Array<{
    type: string
    title: string
  }>
  type: string | null
  source: string | null
  episodes: number | null
  status: string | null
  airing: boolean
  aired: {
    from: string | null
    to: string | null
    string: string
  }
  duration: string | null
  rating: string | null
  score: number | null
  scored_by: number | null
  rank: number | null
  popularity: number | null
  members: number | null
  favorites: number | null
  synopsis: string | null
  background: string | null
  season: string | null
  year: number | null
  genres: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  themes: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  demographics: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
}

export interface JikanSearchResponse {
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
  data: JikanAnime[]
}

export interface JikanErrorResponse {
  status: number
  message: string
}
