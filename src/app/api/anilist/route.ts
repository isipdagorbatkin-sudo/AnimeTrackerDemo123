import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ANILIST_API = 'https://graphql.anilist.co'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60_000

const MAX_RETRIES = 2
const RETRY_DELAY = 1000

function isAniListDisabled(data: any): boolean {
  return data?.errors?.some?.((e: any) =>
    typeof e?.message === 'string' && (
      e.message.includes('temporarily disabled') ||
      e.message.includes('stability issues') ||
      e.message.includes('maintenance')
    )
  )
}

async function fetchWithRetry(body: unknown, attempt = 0): Promise<Response> {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok && attempt < MAX_RETRIES) {
    await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)))
    return fetchWithRetry(body, attempt + 1)
  }

  return response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cacheKey = JSON.stringify(body)

    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { 'Access-Control-Allow-Origin': '*', 'X-Cache': 'HIT' },
      })
    }

    const response = await fetchWithRetry(body)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, {
        status: response.status,
        headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
      })
    }

    const hasGraphQLErrors = data?.errors && data.errors.length > 0 && !data?.data
    const disabled = isAniListDisabled(data)
    const shouldNotCache = hasGraphQLErrors || disabled

    if (!shouldNotCache) {
      cache.set(cacheKey, { data, timestamp: Date.now() })
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': shouldNotCache
          ? 'no-store'
          : 'public, max-age=60, s-maxage=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (err) {
    return NextResponse.json(
      { message: 'Failed to proxy request to AniList API', status: 502 },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
      },
    }
  )
}
