import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KODIK_TOKEN = '56a768d08f43091901c44b54fe970049'
const KODIK_API = 'https://kodik-api.com/search'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ success: false, error: 'Missing q' }, { status: 400 })

  try {
    const url = `${KODIK_API}?token=${KODIK_TOKEN}&title=${encodeURIComponent(q)}&limit=20&with_material_data=true&with_seasons=true&with_episodes=true`
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) throw new Error(`Kodik HTTP ${res.status}`)
    const data = await res.json()
    return NextResponse.json({ success: true, results: data.results || [] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 502 })
  }
}
