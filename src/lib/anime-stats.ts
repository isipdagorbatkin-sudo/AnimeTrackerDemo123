import { getLocalAnimeById } from './local-anime/db'

export async function getEpisodeCount(animeId: number): Promise<number> {
  const local = getLocalAnimeById(animeId)
  if (local) return local.episodes

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`, {
      headers: { 'User-Agent': 'AnimeTracker/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    const json = await res.json()
    return json.data?.episodes ?? 0
  } catch {
    return 0
  }
}

export function formatTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} мин`
  if (totalMinutes < 1440) {
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
  }
  const d = Math.floor(totalMinutes / 1440)
  const h = Math.floor((totalMinutes % 1440) / 60)
  return h > 0 ? `${d} дн ${h} ч` : `${d} дн`
}
