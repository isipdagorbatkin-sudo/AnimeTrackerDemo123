import { NextRequest, NextResponse } from 'next/server'
import { getAnimegoVoices } from '@/lib/animego/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const episode = parseInt(request.nextUrl.searchParams.get('episode') || '1')
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
  try {
    const data = await getAnimegoVoices(id, episode)
    return NextResponse.json({ success: true, ...data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
