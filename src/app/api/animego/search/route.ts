import { NextRequest, NextResponse } from 'next/server'
import { searchAnimego } from '@/lib/animego/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 })
  try {
    const results = await searchAnimego(q)
    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
