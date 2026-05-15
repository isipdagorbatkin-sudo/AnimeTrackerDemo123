import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ANILIST_API = 'https://graphql.anilist.co'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60_000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const cacheKey = JSON.stringify(body)

    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    const response = await fetch(ANILIST_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    cache.set(cacheKey, { data, timestamp: Date.now() })

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { message: 'Failed to proxy request to AniList API', status: 502 },
      { status: 502 }
    )
  }
}
