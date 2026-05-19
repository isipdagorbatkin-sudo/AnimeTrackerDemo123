import { NextRequest, NextResponse } from 'next/server'
import { getAnimegoStream } from '@/lib/animego/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cvhId = request.nextUrl.searchParams.get('cvh_id') || ''
  const season = parseInt(request.nextUrl.searchParams.get('season') || '1')
  const episode = parseInt(request.nextUrl.searchParams.get('episode') || '1')
  const translation = request.nextUrl.searchParams.get('translation') || ''

  if (!cvhId && !translation) {
    return NextResponse.json({ success: false, error: 'Missing stream parameters' }, { status: 400 })
  }

  try {
    const stream = await getAnimegoStream(cvhId, season, episode, translation)
    if (!stream.mp4s.length && !stream.hls && !stream.dash) {
      return NextResponse.json({ success: false, error: 'No stream available' }, { status: 404 })
    }
    return NextResponse.json({ success: true, stream })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
