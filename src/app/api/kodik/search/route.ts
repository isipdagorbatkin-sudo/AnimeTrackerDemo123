import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KODIK_TOKEN = '56a768d08f43091901c44b54fe970049'
const KODIK_API = 'https://kodik-api.com/search'

type KodikApiResult = {
  id?: string
  link?: string
  title?: string
  title_orig?: string
  other_title?: string
  year?: number
  episodes_count?: number
  last_episode?: number
  shikimori_id?: string
  myanimelist_id?: number
  type?: string
  translation?: { id?: number; title?: string; type?: string }
  seasons?: Record<string, unknown>
  material_data?: {
    title?: string
    anime_title?: string
    year?: number
    episodes_total?: number
    episodes_aired?: number
    myanimelist_id?: number
  }
}

function normalizeTitle(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
}

function getResultTitles(item: KodikApiResult): string[] {
  return [
    item.title,
    item.title_orig,
    item.other_title,
    item.material_data?.title,
    item.material_data?.anime_title,
  ].filter(Boolean)
}

function scoreResult(item: KodikApiResult, queries: string[], expectedYear: number | null, expectedEpisodes: number | null, idMal: number | null): number {
  const normalizedQueries = queries.map(normalizeTitle).filter(Boolean)
  const normalizedTitles = getResultTitles(item).map(normalizeTitle).filter(Boolean)
  let score = 0

  const type = String(item.type || '').toLowerCase()
  if (type.includes('anime')) score += 25
  else if (type) score -= 80

  for (const query of normalizedQueries) {
    for (const title of normalizedTitles) {
      if (!query || !title) continue
      if (title === query) score += 90
      else if (title.includes(query) || query.includes(title)) {
        const shorter = Math.min(title.length, query.length)
        const longer = Math.max(title.length, query.length)
        score += shorter / longer > 0.55 ? 45 : 10
      }
    }
  }

  const resultYear = Number(item.year || item.material_data?.year || 0)
  if (expectedYear && resultYear) {
    const diff = Math.abs(resultYear - expectedYear)
    if (diff === 0) score += 35
    else if (diff === 1) score += 15
    else score -= 25
  }

  const resultEpisodes = Number(
    item.episodes_count ||
    item.last_episode ||
    item.material_data?.episodes_total ||
    item.material_data?.episodes_aired ||
    0
  )
  if (expectedEpisodes && resultEpisodes) {
    const diff = Math.abs(resultEpisodes - expectedEpisodes)
    if (diff === 0) score += 35
    else if (diff <= 2) score += 12
    else score -= Math.min(30, diff)
  }

  const malCandidate = Number(item.myanimelist_id || item.material_data?.myanimelist_id || 0)
  const kodikAnimeId = Number(item.shikimori_id || 0)
  if (idMal && malCandidate) {
    score += malCandidate === idMal ? 120 : -80
  }
  if (idMal && kodikAnimeId) {
    score += kodikAnimeId === idMal ? 180 : -120
  }

  return score
}

function isAcceptableResult(item: KodikApiResult & { match_score?: number }, idMal: number | null): boolean {
  const score = Number(item.match_score || 0)
  const malCandidate = Number(item.myanimelist_id || item.material_data?.myanimelist_id || 0)
  const kodikAnimeId = Number(item.shikimori_id || 0)
  const type = String(item.type || '').toLowerCase()

  if (type && !type.includes('anime')) return false
  if (idMal && malCandidate && malCandidate !== idMal) return false
  if (idMal && kodikAnimeId && kodikAnimeId !== idMal) return false
  return score >= (idMal ? 80 : 70)
}

function dedupeResults(results: KodikApiResult[]): KodikApiResult[] {
  const seen = new Set<string>()
  return results.filter((item) => {
    const key = [
      item.id || '',
      item.link || '',
      item.translation?.id,
      item.seasons ? JSON.stringify(Object.keys(item.seasons)) : '',
    ].join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 })
  const fallbacks = request.nextUrl.searchParams.getAll('fallback').filter(Boolean)
  const expectedYear = Number(request.nextUrl.searchParams.get('year') || 0) || null
  const expectedEpisodes = Number(request.nextUrl.searchParams.get('episodes') || 0) || null
  const idMal = Number(request.nextUrl.searchParams.get('idMal') || 0) || null

  try {
    const queries = [...new Set([q, ...fallbacks].map(v => v.trim()).filter(Boolean))]
    const requests = [
      ...(idMal ? [{ key: 'shikimori_id', value: String(idMal), limit: 50 }] : []),
      ...queries.map((query) => ({ key: 'title', value: query, limit: 30 })),
    ]
    const batches = await Promise.all(requests.map(async (request) => {
      const url = `${KODIK_API}?token=${KODIK_TOKEN}&${request.key}=${encodeURIComponent(request.value)}&limit=${request.limit}&with_material_data=true&with_seasons=true&with_episodes=true`
      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) throw new Error(`Kodik HTTP ${res.status}`)
      const data = await res.json()
      return data.results || []
    }))

    const results = dedupeResults(batches.flat())
      .map((item) => ({ ...item, match_score: scoreResult(item, queries, expectedYear, expectedEpisodes, idMal) }))
      .filter((item) => isAcceptableResult(item, idMal))
      .sort((a, b) => b.match_score - a.match_score)

    return NextResponse.json({ success: true, results })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Kodik error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
