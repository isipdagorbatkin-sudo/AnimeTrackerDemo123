import { NextRequest, NextResponse } from 'next/server'
import { buildAnimefireSlugCandidates, findAnfireAnime, getSlugFromAnimefireLink } from '@/lib/anfire/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EXTERNAL_API_URL = process.env.ANFIRE_API_URL
const EXTERNAL_API_KEY = process.env.ANFIRE_API_KEY

async function fetchExternalAnfire(params: {
  title?: string | null
  fallbacks: string[]
  link?: string | null
  slug?: string | null
}) {
  if (!EXTERNAL_API_URL || !EXTERNAL_API_KEY) return null

  const baseUrl = EXTERNAL_API_URL.replace(/\/+$/, '')
  const manualSlug = params.slug || (params.link ? getSlugFromAnimefireLink(params.link) : null)
  const candidates = manualSlug
    ? [manualSlug]
    : buildAnimefireSlugCandidates([params.title || '', ...params.fallbacks].filter(Boolean))

  for (const candidate of candidates.slice(0, 16)) {
    const url = new URL(baseUrl)
    url.searchParams.set('api_key', EXTERNAL_API_KEY)
    if (params.link) {
      url.searchParams.set('anime_link', params.link)
    } else {
      url.searchParams.set('anime_slug', candidate)
    }

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) continue
    const data = await res.json().catch(() => null)
    if (!data || data.error || !Array.isArray(data.episodes) || data.episodes.length === 0) continue

    return {
      ...data,
      anime_slug: data.anime_slug || candidate,
      matched_by: params.link ? 'link' : manualSlug ? 'slug' : 'title',
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get('title')
  const fallbacks = request.nextUrl.searchParams.getAll('fallback').filter(Boolean)
  const link = request.nextUrl.searchParams.get('link')
  const slug = request.nextUrl.searchParams.get('slug')
  const expectedEpisodes = Number(request.nextUrl.searchParams.get('episodes') || 0) || 0

  if (!title && !link && !slug) {
    return NextResponse.json({ success: false, error: 'Missing title, link or slug' }, { status: 400 })
  }

  const maxEpisodes = expectedEpisodes > 0
    ? Math.min(Math.max(expectedEpisodes + 2, 24), 120)
    : 80

  try {
    const externalAnime = await fetchExternalAnfire({ title, fallbacks, link, slug })
    if (externalAnime) {
      return NextResponse.json({ success: true, anime: externalAnime })
    }

    const anime = await findAnfireAnime({
      titles: [title || '', ...fallbacks].filter(Boolean),
      link,
      slug,
      maxEpisodes,
    })

    if (!anime) {
      return NextResponse.json({
        success: false,
        error: 'AnimeFire не нашел тайтл автоматически. Можно вставить ссылку AnimeFire вручную.',
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, anime })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AnFire error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
