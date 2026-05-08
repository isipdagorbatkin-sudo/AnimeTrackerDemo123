import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SHIKIMORI_BASE = 'https://shikimori.one/api'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60_000

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const searchString = request.nextUrl.search
  const cacheKey = `${path}${searchString}`

  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { 'Access-Control-Allow-Origin': '*', 'X-Cache': 'HIT' },
    })
  }

  try {
    const response = await fetch(`${SHIKIMORI_BASE}/${path}${searchString}`, {
      headers: {
        'User-Agent': 'AnimeTracker/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
      })
    }

    cache.set(cacheKey, { data, timestamp: Date.now() })

    const resHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=60',
      'X-Cache': 'MISS',
    }
    const total = response.headers.get('X-Total')
    const page = response.headers.get('X-Page')
    const perPage = response.headers.get('X-Per-Page')
    const totalPages = response.headers.get('X-Total-Pages')
    if (total) resHeaders['X-Total'] = total
    if (page) resHeaders['X-Page'] = page
    if (perPage) resHeaders['X-Per-Page'] = perPage
    if (totalPages) resHeaders['X-Total-Pages'] = totalPages

    return NextResponse.json(data, { headers: resHeaders })
  } catch (err) {
    return NextResponse.json(
      { message: 'Failed to proxy request to Shikimori API', status: 502 },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
