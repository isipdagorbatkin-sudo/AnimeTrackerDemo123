import { NextRequest, NextResponse } from 'next/server'
import { searchAnilibria } from '@/lib/anilibria/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  const fallbacks = request.nextUrl.searchParams.getAll('fallback').filter(Boolean)
  const year = Number(request.nextUrl.searchParams.get('year') || 0) || null
  const episodes = Number(request.nextUrl.searchParams.get('episodes') || 0) || null

  if (!q) {
    return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 })
  }

  try {
    const result = await searchAnilibria({
      titles: [q, ...fallbacks],
      year,
      episodes,
    })

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'AniLibria не нашла подходящий релиз автоматически.',
      }, { status: 404 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AniLibria error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
