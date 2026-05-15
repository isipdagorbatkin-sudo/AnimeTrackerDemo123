const KODIK_TOKEN = '56a768d08f43091901c44b54fe970049'
const KODIK_API = 'https://kodik-api.com/search'

export interface KodikResult {
  id: string
  type: string
  link: string
  title: string
  title_orig: string
  other_title: string
  year: number
  shikimori_id: string
  translation: {
    id: number
    title: string
    type: 'voice' | 'subtitles'
  }
  episodes_count?: number
  last_season?: number
  last_episode?: number
  seasons?: Record<string, {
    link: string
    episodes: Record<string, string>
  }>
  material_data?: {
    description: string
    poster_url: string
    anime_genres: string[]
    anime_status: string
    anime_kind: string
    year: number
    duration: number
    imdb_rating: number
    shikimori_rating: number
    kinopoisk_rating: number
    episodes_total: number
    episodes_aired: number
  }
}

export async function searchKodik(title: string): Promise<KodikResult[]> {
  try {
    const res = await fetch(`${KODIK_API}?token=${KODIK_TOKEN}&title=${encodeURIComponent(title)}&limit=20&with_material_data=true&with_seasons=true&with_episodes=true`, {
      method: 'POST',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

export function getEmbedLink(result: KodikResult, season?: string, episode?: string): string {
  let link: string
  if (season && result.seasons?.[season]) {
    if (episode && result.seasons[season].episodes?.[episode]) {
      link = result.seasons[season].episodes[episode]
    } else {
      link = result.seasons[season].link
    }
  } else {
    link = result.link
  }
  return `https:${link}`
}
