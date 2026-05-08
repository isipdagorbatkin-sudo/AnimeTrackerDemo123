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

async function proxy(request: NextRequest, path: string[]) {
  try {
    const target = `${SUPABASE_URL}/${path.join('/')}${request.nextUrl.search}`
    const headers = new Headers(request.headers)
    headers.delete('host')

    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
      signal: AbortSignal.timeout(30000),
    })

    const data = response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text()

    return new NextResponse(
      typeof data === 'string' ? data : JSON.stringify(data),
      {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
          'Access-Control-Allow-Headers': '*',
        },
      }
    )
  } catch (err) {
    return NextResponse.json(
      { message: 'Proxy error' },
      { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
