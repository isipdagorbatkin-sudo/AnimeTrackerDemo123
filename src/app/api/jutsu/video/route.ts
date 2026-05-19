import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        'Referer': 'https://jut.su/',
        'Accept': 'video/webm,video/ogg,video/mp4,*/*',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Video fetch failed: ${response.status}` }, { status: 502 })
    }

    const contentType = response.headers.get('Content-Type') || 'video/mp4'
    const contentLength = response.headers.get('Content-Length')
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    }
    if (contentLength) headers['Content-Length'] = contentLength

    return new NextResponse(response.body, { headers })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to proxy video' },
      { status: 502 }
    )
  }
}
