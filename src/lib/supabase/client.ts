import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function installFetchProxy() {
  if ((window as any).__supaProxyInstalled) return
  const orig = window.fetch.bind(window)
  window.fetch = async (input, init) => {
    const req = input instanceof Request ? input : new Request(String(input), init)
    const url = req.url
    if (url.startsWith(SUPA_URL)) {
      const proxyUrl = url.replace(SUPA_URL, `${window.location.origin}/api/supabase`)
      const headers = new Headers(req.headers)
      headers.set('origin', window.location.origin)
      const proxyReq = new Request(proxyUrl, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.clone().text() : undefined,
      })
      return orig(proxyReq)
    }
    return orig(input, init)
  }
  ;(window as any).__supaProxyInstalled = true
}

export function createClient() {
  if (typeof window !== 'undefined') {
    installFetchProxy()
  }

  return createBrowserClient<Database>(
    SUPA_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: { params: { log_level: 'error' as const } },
    }
  )
}
