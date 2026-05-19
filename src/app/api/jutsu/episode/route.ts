import { NextRequest, NextResponse } from 'next/server'
import { fetchMp4Links } from '@/lib/jutsu/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  if (!url.startsWith('https://jut.su/')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const links = await fetchMp4Links(url)
    if (Object.keys(links).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No video sources found' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, links, url })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch episode' },
      { status: 502 }
    )
  }
}
