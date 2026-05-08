import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
}

async function proxy(request: NextRequest, path: string[]) {
  try {
    const target = `${SUPABASE_URL}/${path.join('/')}${request.nextUrl.search}`

    const headers = new Headers()
    headers.set('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const auth = request.headers.get('authorization')
    if (auth) headers.set('authorization', auth)
    const ct = request.headers.get('content-type')
    if (ct) headers.set('content-type', ct)
    const prefer = request.headers.get('prefer')
    if (prefer) headers.set('prefer', prefer)
    const accept = request.headers.get('accept')
    if (accept) headers.set('accept', accept)

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      signal: AbortSignal.timeout(30000),
    })

    const resHeaders = new Headers(response.headers)
    resHeaders.set('Access-Control-Allow-Origin', '*')
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    resHeaders.set('Access-Control-Allow-Headers', '*')

    const body = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text()

    return new NextResponse(
      typeof body === 'string' ? body : JSON.stringify(body),
      { status: response.status, headers: resHeaders }
    )
  } catch (err) {
    return NextResponse.json(
      { message: 'Proxy error' },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
