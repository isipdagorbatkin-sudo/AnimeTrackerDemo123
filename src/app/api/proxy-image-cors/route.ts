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
    console.log('Proxying image via CORS proxy:', imageUrl)

    // Используем allorigins.win как CORS proxy
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`

    const response = await fetch(corsProxyUrl, {
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.error('CORS proxy fetch failed:', response.status, response.statusText)
      throw new Error(`Failed to fetch image via CORS proxy: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    console.log('Image loaded via CORS proxy, size:', imageBuffer.byteLength, 'type:', contentType)

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
    console.error('Error proxying image via CORS:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
