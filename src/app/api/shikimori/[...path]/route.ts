import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHIKIMORI_BASE = 'https://shikimori.one/api'

const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 120_000

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function isShikimoriError(data: any): boolean {
  return data && typeof data === 'object' && (
    Array.isArray(data) === false ||
    (Array.isArray(data) && data.length === 0)
  ) === false
}

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

  const urls = [
    `${SHIKIMORI_BASE}/${path}${searchString}`,
  ]

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
          'Accept': 'application/json',
        },
      })

      if (response.status === 429) {
        continue
      }

      const data = await response.json()

      if (response.ok) {
        cache.set(cacheKey, { data, timestamp: Date.now() })
        const resHeaders: Record<string, string> = {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=120, s-maxage=120',
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
      }
    } catch {
      continue
    }
  }

  return NextResponse.json([], {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
