import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    console.log('Proxying image via Edge:', imageUrl)

    // Используем fetch с правильными заголовками для обхода блокировок
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://shikimori.one/',
        'Origin': 'https://shikimori.one',
      },
      // Увеличиваем таймаут для медленных соединений
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.error('Image fetch failed:', response.status, response.statusText)
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    console.log('Image loaded successfully, size:', imageBuffer.byteLength, 'type:', contentType)

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
        'CDN-Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error proxying image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
