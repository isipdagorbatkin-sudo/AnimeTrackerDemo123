import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/api/supabase`
    : process.env.NEXT_PUBLIC_SUPABASE_URL!

  return createBrowserClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: { params: { log_level: 'error' as const } },
    }
  )
}
