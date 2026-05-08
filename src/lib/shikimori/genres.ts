let genreCache: Array<{ id: number; name: string; russian: string }> | null = null

export async function getShikimoriGenres(): Promise<Array<{ id: number; name: string; russian: string }>> {
  if (genreCache) return genreCache
  const res = await fetch('/api/shikimori/genres')
  if (!res.ok) return []
  const data: Array<{ id: number; name: string; russian: string; kind: string; entry_type: string }> = await res.json()
  genreCache = data.map(g => ({ id: g.id, name: g.name, russian: g.russian }))
  return genreCache
}

export async function getShikimoriGenreId(englishName: string): Promise<number | null> {
  const genres = await getShikimoriGenres()
  const found = genres.find(g => g.name === englishName || g.russian === englishName)
  return found?.id ?? null
}
