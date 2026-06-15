import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const YUMMY_API = 'https://api.yani.tv'
const USER_AGENT = 'AnimeTracker/1.0 (+https://animetrackers.vercel.app)'

type YummyAnime = {
  title?: string
  anime_id?: number
  anime_url?: string
  year?: number
  blocked_in?: string[]
  episodes?: {
    count?: number
    aired?: number
  }
  remote_ids?: {
    myanimelist_id?: number
    shikimori_id?: number
    kp_id?: number
  }
}

type YummyVideo = {
  video_id?: number
  number?: string
  iframe_url?: string
  index?: number
  views?: number
  duration?: number
  thumbnail?: string
  preview?: string
  image?: string
  date?: string
  aired_at?: string
  created_at?: string
  data?: {
    player?: string
    dubbing?: string
    player_id?: number
    thumbnail?: string
    preview?: string
    image?: string
    date?: string
    aired_at?: string
  }
  skips?: {
    opening?: { time?: number; length?: number } | null
    ending?: { time?: number; length?: number } | null
  }
}

type YummySource = {
  key: string
  player: string
  dubbing: string
  episodes: {
    id: string
    number: number
    label: string
    iframeUrl: string
    duration?: number
    views?: number
    thumbnail?: string
    airedAt?: string
    skips?: YummyVideo['skips']
  }[]
}

function normalizeTitle(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreAnime(item: YummyAnime, queries: string[], expectedYear: number | null, expectedEpisodes: number | null, idMal: number | null): number {
  const normalizedTitle = normalizeTitle(item.title)
  const normalizedQueries = queries.map(normalizeTitle).filter(Boolean)
  let score = 0

  for (const query of normalizedQueries) {
    if (!query || !normalizedTitle) continue
    if (normalizedTitle === query) score += 120
    else if (normalizedTitle.includes(query) || query.includes(normalizedTitle)) {
      const shorter = Math.min(normalizedTitle.length, query.length)
      const longer = Math.max(normalizedTitle.length, query.length)
      score += shorter / longer > 0.55 ? 55 : 15
    }
  }

  const malId = Number(item.remote_ids?.myanimelist_id || 0)
  if (idMal && malId) score += malId === idMal ? 220 : -140

  if (expectedYear && item.year) {
    const diff = Math.abs(expectedYear - item.year)
    if (diff === 0) score += 45
    else if (diff === 1) score += 15
    else score -= 30
  }

  const episodeCount = Number(item.episodes?.count || item.episodes?.aired || 0)
  if (expectedEpisodes && episodeCount) {
    const diff = Math.abs(expectedEpisodes - episodeCount)
    if (diff === 0) score += 35
    else if (diff <= 2) score += 12
    else score -= Math.min(35, diff)
  }

  return score
}

function absolutizeUrl(value: string | null | undefined): string {
  if (!value) return ''
  if (value.startsWith('//')) return `https:${value}`
  return value
}

function isAlternativePlayer(video: YummyVideo): boolean {
  const player = String(video.data?.player || '').toLowerCase()
  const dubbing = String(video.data?.dubbing || '').toLowerCase()
  const supportedPlayer = (
    player.includes('cvh') ||
    player.includes('holles') ||
    player.includes('collapse') ||
    player.includes('aniboom') ||
    player.includes('sibnet')
  )
  const unsupportedDubbing = dubbing.includes('субтит') || dubbing.includes('казах')
  return Boolean(video.iframe_url) && supportedPlayer && !unsupportedDubbing
}

function sourcePriority(player: string): number {
  const normalized = player.toLowerCase()
  if (normalized.includes('cvh')) return 60
  if (normalized.includes('holles')) return 50
  if (normalized.includes('collapse')) return 40
  if (normalized.includes('aniboom')) return 30
  if (normalized.includes('sibnet')) return 20
  return 10
}

function buildSources(videos: YummyVideo[]): YummySource[] {
  const map = new Map<string, YummySource>()

  for (const video of videos.filter(isAlternativePlayer)) {
    const player = video.data?.player || 'Yummy'
    const dubbing = video.data?.dubbing || 'Озвучка'
    const key = `${player}:${dubbing}`
    const number = Number(video.number || 0) || 1
    const iframeUrl = absolutizeUrl(video.iframe_url)
    const thumbnail = absolutizeUrl(video.data?.thumbnail || video.data?.preview || video.data?.image || video.thumbnail || video.preview || video.image)
    const airedAt = video.data?.aired_at || video.data?.date || video.aired_at || video.date || video.created_at
    if (!iframeUrl) continue

    const source = map.get(key) || {
      key,
      player,
      dubbing,
      episodes: [],
    }

    if (!source.episodes.some((episode) => episode.number === number && episode.iframeUrl === iframeUrl)) {
      source.episodes.push({
        id: String(video.video_id || `${key}:${number}:${iframeUrl}`),
        number,
        label: `Серия ${number}`,
        iframeUrl,
        duration: video.duration,
        views: video.views,
        thumbnail: thumbnail || undefined,
        airedAt: airedAt || undefined,
        skips: video.skips,
      })
    }

    map.set(key, source)
  }

  return [...map.values()]
    .map((source) => ({
      ...source,
      episodes: source.episodes.sort((a, b) => a.number - b.number),
    }))
    .sort((a, b) => {
      const byEpisodeCount = b.episodes.length - a.episodes.length
      if (byEpisodeCount) return byEpisodeCount
      return sourcePriority(b.player) - sourcePriority(a.player)
    })
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`YummyAnime HTTP ${res.status}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 })

  const fallbacks = request.nextUrl.searchParams.getAll('fallback').filter(Boolean)
  const expectedYear = Number(request.nextUrl.searchParams.get('year') || 0) || null
  const expectedEpisodes = Number(request.nextUrl.searchParams.get('episodes') || 0) || null
  const idMal = Number(request.nextUrl.searchParams.get('idMal') || 0) || null
  const queries = [...new Set([q, ...fallbacks].map((value) => value.trim()).filter(Boolean))]

  try {
    const batches = await Promise.all(
      queries.slice(0, 5).map(async (query) => {
        const data = await fetchJson<{ response?: YummyAnime[] }>(
          `${YUMMY_API}/anime?q=${encodeURIComponent(query)}&offset=0&limit=12`
        )
        return data.response || []
      })
    )

    const seen = new Set<number>()
    const candidates = batches
      .flat()
      .filter((item) => {
        const id = Number(item.anime_id || 0)
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
      .map((item) => ({
        ...item,
        match_score: scoreAnime(item, queries, expectedYear, expectedEpisodes, idMal),
      }))
      .filter((item) => item.match_score >= (idMal ? 120 : 70))
      .sort((a, b) => b.match_score - a.match_score)

    for (const anime of candidates.slice(0, 5)) {
      const videosData = await fetchJson<{ response?: YummyVideo[] }>(`${YUMMY_API}/anime/${anime.anime_id}/videos`)
      const sources = buildSources(videosData.response || [])
      if (sources.length > 0) {
        return NextResponse.json({
          success: true,
          anime: {
            id: anime.anime_id,
            title: anime.title,
            year: anime.year,
            blockedIn: anime.blocked_in || [],
            matchScore: anime.match_score,
          },
          sources,
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'YummyAnime не нашёл альтернативный плеер без Kodik.' },
      { status: 404 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown YummyAnime error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
