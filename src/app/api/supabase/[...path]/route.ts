import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

async function proxy(request: NextRequest, path: string[]) {
  try {
    const target = `${SUPABASE_URL}/${path.join('/')}${request.nextUrl.search}`

    const headers: Record<string, string> = {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
    const auth = request.headers.get('authorization')
    if (auth) headers['authorization'] = auth
    const ct = request.headers.get('content-type')
    if (ct) headers['content-type'] = ct
    const prefer = request.headers.get('prefer')
    if (prefer) headers['prefer'] = prefer
    const accept = request.headers.get('accept') || 'application/json'
    headers['accept'] = accept

    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text()

    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(30000),
    })

    const resHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(lower)) return
      resHeaders[key] = value
    })
    resHeaders['Access-Control-Allow-Origin'] = '*'
    resHeaders['Access-Control-Allow-Headers'] = '*'

    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: resHeaders,
    })
  } catch (err) {
    return new NextResponse(JSON.stringify({ message: 'Proxy error' }), {
      status: 502,
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path)
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(request, params.path)
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
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
