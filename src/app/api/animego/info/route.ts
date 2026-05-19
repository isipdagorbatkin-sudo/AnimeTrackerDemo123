import { NextRequest, NextResponse } from 'next/server'
import { getAnimegoInfo } from '@/lib/animego/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ success: false, error: 'Missing url' }, { status: 400 })
  try {
    const info = await getAnimegoInfo(url)
    return NextResponse.json({ success: true, info })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
