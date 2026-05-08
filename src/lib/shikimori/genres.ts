export interface ShikimoriGenre {
  id: number
  name: string
  russian: string
  kind: string
}

let genreCache: ShikimoriGenre[] | null = null

export async function getShikimoriGenres(): Promise<ShikimoriGenre[]> {
  if (genreCache) return genreCache
  const res = await fetch('/api/shikimori/genres')
  if (!res.ok) return []
  const data: ShikimoriGenre[] = await res.json()
  genreCache = data.map(g => ({ id: g.id, name: g.name, russian: g.russian, kind: g.kind }))
  return genreCache
}

export async function getShikimoriGenreId(englishName: string): Promise<number | null> {
  const genres = await getShikimoriGenres()
  const found = genres.find(g => g.name === englishName || g.russian === englishName)
  return found?.id ?? null
}
