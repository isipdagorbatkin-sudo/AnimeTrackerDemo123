import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SHIKIMORI_BASE = 'https://shikimori.one/api'

async function fetchShikimori(path: string): Promise<any[]> {
  const res = await fetch(`${SHIKIMORI_BASE}/${path}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
      'Accept': 'application/json',
    },
  })
  if (!res.ok) return []
  return res.json()
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 })

  try {
    const data = await fetchShikimori(`animes?search=${encodeURIComponent(q)}&limit=10`)
    if (!Array.isArray(data)) {
      return NextResponse.json({ success: false, error: 'Invalid response' }, { status: 502 })
    }

    const results = data.map((a: any) => ({
      id: String(a.id),
      slug: a.url?.replace(/^\/+/, '') || String(a.id),
      link: `https://shikimori.one${a.url || ''}`,
      title: a.russian || a.name || '',
      originalTitle: a.name || a.english?.[0] || null,
      image: a.image?.original ? `https://shikimori.one${a.image.original}` : null,
      year: a.aired_on ? parseInt(a.aired_on) : null,
      type: a.kind || null,
    }))

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
