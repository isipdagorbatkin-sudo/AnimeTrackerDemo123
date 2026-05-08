const ANILIST_API = 'https://graphql.anilist.co'

export interface AniListAnime {
  id: number
  title: {
    romaji: string
    english: string | null
    native: string | null
  }
  description: string | null
  coverImage: {
    large: string
    medium: string
  }
  bannerImage: string | null
  genres: string[]
  averageScore: number
  episodes: number | null
  status: string
  type: string
  season: string | null
  seasonYear: number | null
}

export interface AniListSearchResponse {
  Page: {
    media: AniListAnime[]
    pageInfo: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
      hasNextPage: boolean
    }
  }
}

export async function searchAnime(query: string, page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($search: String, $page: Int) {
            Page(page: $page, perPage: 20) {
              media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: {
          search: query,
          page,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('AniList response:', data)

    if (!data.data || !data.data.Page) {
      throw new Error('Invalid response structure from AniList API')
    }

    return data.data
  } catch (error) {
    console.error('Error in searchAnime:', error)
    throw error
  }
}

export async function getAnimeById(id: number): Promise<AniListAnime> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($id: Int) {
            Media(id: $id, type: ANIME) {
              id
              title {
                romaji
                english
                native
              }
              description
              coverImage {
                large
                medium
              }
              bannerImage
              genres
              averageScore
              episodes
              status
              type
              season
              seasonYear
            }
          }
        `,
        variables: {
          id,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('AniList getAnimeById response:', data)

    if (!data.data || !data.data.Media) {
      throw new Error('Invalid response structure from AniList API')
    }

    return data.data.Media
  } catch (error) {
    console.error('Error in getAnimeById:', error)
    throw error
  }
}

export function convertToJikanFormat(anime: AniListAnime): any {
  return {
    mal_id: anime.id,
    title: anime.title.english || anime.title.romaji || 'Без названия',
    title_japanese: anime.title.native,
    synopsis: anime.description,
    images: {
      jpg: {
        large_image_url: anime.coverImage?.large || '',
        image_url: anime.coverImage?.medium || '',
      },
    },
    genres: (anime.genres || []).map((name, index) => ({ mal_id: index, name })),
    score: anime.averageScore ? anime.averageScore / 10 : null,
    episodes: anime.episodes,
    status: anime.status,
    type: anime.type,
    year: anime.seasonYear,
  }
}

// Получить онгоинги (текущие аниме)
export async function getAiringAnime(page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($page: Int) {
            Page(page: $page, perPage: 20) {
              media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: { page },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error in getAiringAnime:', error)
    throw error
  }
}

// Получить анонсы (будущие аниме)
export async function getUpcomingAnime(page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($page: Int) {
            Page(page: $page, perPage: 20) {
              media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: { page },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error in getUpcomingAnime:', error)
    throw error
  }
}

// Получить завершенные аниме
export async function getCompletedAnime(page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($page: Int) {
            Page(page: $page, perPage: 20) {
              media(type: ANIME, status: FINISHED, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: { page },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error in getCompletedAnime:', error)
    throw error
  }
}

// Получить фильмы
export async function getMovies(page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($page: Int) {
            Page(page: $page, perPage: 20) {
              media(type: ANIME, format: MOVIE, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: { page },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error in getMovies:', error)
    throw error
  }
}

// Получить последние вышедшие аниме
export async function getLatestAnime(page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($page: Int) {
            Page(page: $page, perPage: 20) {
              media(type: ANIME, sort: START_DATE_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: { page },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error in getLatestAnime:', error)
    throw error
  }
}

// Получить аниме по жанру
export async function getAnimeByGenre(genre: string, page: number = 1): Promise<AniListSearchResponse> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query ($genre: String, $page: Int) {
            Page(page: $page, perPage: 20) {
              media(type: ANIME, genre: $genre, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                  english
                  native
                }
                description
                coverImage {
                  large
                  medium
                }
                bannerImage
                genres
                averageScore
                episodes
                status
                type
                season
                seasonYear
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
        variables: { genre, page },
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error in getAnimeByGenre:', error)
    throw error
  }
}

// Получить список всех жанров
export async function getAllGenres(): Promise<string[]> {
  try {
    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            GenreCollection
          }
        `,
      }),
    })

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data.GenreCollection || []
  } catch (error) {
    console.error('Error in getAllGenres:', error)
    throw error
  }
}
