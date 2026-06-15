const ANILIST_PROXY = '/api/anilist'

export interface AniListAnime {
  id: number
  idMal: number | null
  title: {
    romaji: string
    english: string | null
    native: string | null
  }
  description: string | null
  coverImage: {
    extraLarge: string
    large: string
    medium: string
  }
  bannerImage: string | null
  genres: string[]
  averageScore: number | null
  meanScore: number | null
  popularity: number | null
  episodes: number | null
  duration: number | null
  status: string
  type: string
  format: string
  season: string | null
  seasonYear: number | null
  startDate: { year: number | null; month: number | null; day: number | null }
  endDate: { year: number | null; month: number | null; day: number | null }
  source: string | null
  studios: { nodes: { id: number; name: string }[] }
  trailer: { id: string; site: string; thumbnail: string } | null
  tags: { id: number; name: string; rank: number }[]
  rankings: { rank: number; type: string; allTime: boolean }[]
}

export interface AniListCharacter {
  id: number
  name: { full: string; native: string | null }
  image: { large: string; medium: string }
  role: string
  description: string | null
}

export interface AniListPageInfo {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  hasNextPage: boolean
}

export interface AniListSearchResponse {
  Page: {
    media: AniListAnime[]
    pageInfo: AniListPageInfo
  }
}

export type AnimeSortOption = 'POPULARITY_DESC' | 'SCORE_DESC' | 'START_DATE_DESC' | 'START_DATE' | 'TITLE_ROMAJI'

export interface AniListCharactersResponse {
  Media: {
    characters: {
      nodes: AniListCharacter[]
    }
  }
}

export interface AniListRecommendation {
  id: number
  mediaRecommendation: AniListAnime
}

export interface AniListRelationEdge {
  relationType: string
  node: AniListAnime
}

const ANIME_FRAGMENT = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  description
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  genres
  averageScore
  meanScore
  popularity
  episodes
  duration
  status
  type
  format
  season
  seasonYear
  startDate {
    year
    month
    day
  }
  endDate {
    year
    month
    day
  }
  source
  studios {
    nodes {
      id
      name
    }
  }
  trailer {
    id
    site
    thumbnail
  }
  tags {
    id
    name
    rank
  }
  rankings {
    rank
    type
    allTime
  }
`

async function queryAniList<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(ANILIST_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.message || `AniList API error: ${response.status}`)
  }

  const body = await response.json()

  if (body.errors && !body.data) {
    throw new Error(body.errors[0]?.message || 'AniList GraphQL error')
  }

  return body.data
}

export async function searchAnime(query: string, page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { search: query, page, perPage, sort: [sort] }
  )
}

export async function getAnimeById(id: number): Promise<AniListAnime | null> {
  try {
    const data = await queryAniList<{ Media: AniListAnime }>(
      `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ${ANIME_FRAGMENT}
        }
      }
      `,
      { id }
    )
    return data.Media || null
  } catch {
    return null
  }
}

export async function getAnimeByMalId(idMal: number): Promise<AniListAnime | null> {
  try {
    const data = await queryAniList<{ Media: AniListAnime }>(
      `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          ${ANIME_FRAGMENT}
        }
      }
      `,
      { idMal }
    )
    return data.Media || null
  } catch {
    return null
  }
}

export async function getTopAnime(page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { page, perPage, sort: [sort] }
  )
}

export async function getAiringAnime(page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { page, perPage, sort: [sort] }
  )
}

export async function getUpcomingAnime(page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { page, perPage, sort: [sort] }
  )
}

export async function getCompletedAnime(page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: FINISHED, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { page, perPage, sort: [sort] }
  )
}

export async function getMovies(page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, format: MOVIE, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { page, perPage, sort: [sort] }
  )
}

export async function getAnimeByGenre(genre: string, page = 1, perPage = 20, sort: AnimeSortOption = 'POPULARITY_DESC'): Promise<AniListSearchResponse> {
  return queryAniList<AniListSearchResponse>(
    `
    query ($genre: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, genre: $genre, sort: $sort) {
          ${ANIME_FRAGMENT}
        }
        pageInfo {
          total
          perPage
          currentPage
          lastPage
          hasNextPage
        }
      }
    }
    `,
    { genre, page, perPage, sort: [sort] }
  )
}

export async function getAllGenres(): Promise<string[]> {
  try {
    const data = await queryAniList<{ GenreCollection: string[] }>(
      `
      query {
        GenreCollection
      }
      `
    )
    return data.GenreCollection || []
  } catch {
    return []
  }
}

export async function getAnimeCharacters(animeId: number): Promise<AniListCharacter[]> {
  try {
    const data = await queryAniList<AniListCharactersResponse>(
      `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          characters(role: MAIN, perPage: 20, sort: ROLE) {
            nodes {
              id
              name {
                full
                native
              }
              image {
                large
                medium
              }
              role
              description
            }
          }
        }
      }
      `,
      { id: animeId }
    )
    return data.Media?.characters?.nodes || []
  } catch {
    return []
  }
}

export async function getSimilarAnime(animeId: number): Promise<AniListAnime[]> {
  try {
    const data = await queryAniList<{ Media: { recommendations: { nodes: { mediaRecommendation: AniListAnime }[] } } }>(
      `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          recommendations(perPage: 10, sort: RATING_DESC) {
            nodes {
              mediaRecommendation {
                ${ANIME_FRAGMENT}
              }
            }
          }
        }
      }
      `,
      { id: animeId }
    )
    return data.Media?.recommendations?.nodes?.map(n => n.mediaRecommendation).filter(Boolean) || []
  } catch {
    return []
  }
}

export async function getAnimeRelations(animeId: number): Promise<{ relationType: string; node: AniListAnime }[]> {
  try {
    const data = await queryAniList<{ Media: { relations: { edges: AniListRelationEdge[] } } }>(
      `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          relations {
            edges {
              relationType
              node {
                ${ANIME_FRAGMENT}
              }
            }
          }
        }
      }
      `,
      { id: animeId }
    )
    return data.Media?.relations?.edges || []
  } catch {
    return []
  }
}

export async function getRandomAnime(): Promise<AniListAnime | null> {
  const randomPage = Math.floor(Math.random() * 200) + 1
  const randomIndex = Math.floor(Math.random() * 20)
  try {
    const data = await queryAniList<AniListSearchResponse>(
      `
      query ($page: Int) {
        Page(page: $page, perPage: 20) {
          media(type: ANIME, sort: POPULARITY_DESC) {
            ${ANIME_FRAGMENT}
          }
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
        }
      }
      `,
      { page: randomPage }
    )
    const media = data.Page?.media
    return media && media.length > 0 ? media[randomIndex % media.length] : null
  } catch {
    return null
  }
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    RELEASING: 'Выходит',
    FINISHED: 'Завершено',
    NOT_YET_RELEASED: 'Анонс',
    CANCELLED: 'Отменено',
    HIATUS: 'На паузе',
  }
  return map[status] || status
}

export function getFormatText(format: string): string {
  const map: Record<string, string> = {
    TV: 'ТВ',
    TV_SHORT: 'ТВ (короткий)',
    MOVIE: 'Фильм',
    OVA: 'OVA',
    ONA: 'ONA',
    SPECIAL: 'Спец.',
    MUSIC: 'Музыка',
  }
  return map[format] || format
}

export function getCoverImage(anime: AniListAnime): string {
  return anime.coverImage?.extraLarge || anime.coverImage?.large || anime.coverImage?.medium || ''
}

export function formatScore(score: number | null): number {
  if (!score) return 0
  return Math.round(score / 10 * 10) / 10
}
