import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const KODIK_API_BASE = 'https://kodik-api.com'
const KODIK_TOKEN = process.env.KODIK_TOKEN || '447d179e875efe44217f20d1ee2146be'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const upstreamUrl = new URL(`${KODIK_API_BASE}/${path}`)

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'token') upstreamUrl.searchParams.set(key, value)
  })
  upstreamUrl.searchParams.set('token', KODIK_TOKEN)

  try {
    const response = await fetch(upstreamUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    })
    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    })
  } catch {
    return NextResponse.json(
      { message: 'Failed to proxy request to Kodik API', status: 502 },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
