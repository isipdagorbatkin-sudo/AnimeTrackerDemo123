'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Play } from 'lucide-react'

const KODIK_TOKEN = '56a768d08f43091901c44b54fe970049'
const KODIK_API = 'https://kodik-api.com/search'

async function searchKodik(title: string): Promise<any[]> {
  const url = `${KODIK_API}?token=${KODIK_TOKEN}&title=${encodeURIComponent(title)}&limit=20&with_material_data=true&with_seasons=true&with_episodes=true`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export function KodikPlayer({ animeTitle, fallbackTitles }: { animeTitle: string; fallbackTitles?: string[] }) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const doSearch = useCallback(async (title: string) => {
    setLoading(true)
    setError('')
    const queries = [title, ...(fallbackTitles || [])].filter((v, i, a) => v && a.indexOf(v) === i)

    try {
      let found: any = null
      for (const q of queries) {
        const list = await searchKodik(q)
        if (list.length > 0) {
          found = list[0]
          break
        }
      }
      if (!found) {
        setError(`Аниме не найдено в Kodik: "${title}"`)
        setLoading(false)
        return
      }
      setEmbedUrl(`https:${found.link}`)
      setLoading(false)
    } catch (err: any) {
      setError('Ошибка: ' + (err.message || 'неизвестная'))
      setLoading(false)
    }
  }, [fallbackTitles])

  useEffect(() => {
    if (animeTitle) doSearch(animeTitle)
  }, [animeTitle, doSearch])

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            {loading ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Поиск...</p>
              </div>
            ) : (
              <div className="text-center p-4">
                <Play className="h-12 w-12 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
      {error && (
        <div className="text-destructive bg-destructive/10 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}
    </div>
  )
}
