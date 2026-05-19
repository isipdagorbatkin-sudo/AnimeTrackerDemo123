import { NextRequest, NextResponse } from 'next/server'
import { getAnimegoEpisodes } from '@/lib/animego/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
  try {
    const episodes = await getAnimegoEpisodes(id)
    return NextResponse.json({ success: true, episodes })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
