export interface AnfireEpisodeSource {
  url: string | null
  resolution: string
  status: 'ONLINE' | 'OFFLINE'
}

export interface AnfireEpisode {
  episode: number
  data: AnfireEpisodeSource[]
  status?: 'ONLINE' | 'OFFLINE'
}

export interface AnfireAnime {
  anime_slug: string
  anime_title?: string | null
  anime_title1?: string | null
  anime_image?: string | null
  anime_info?: string | null
  anime_synopsis?: string | null
  episodes: AnfireEpisode[]
  matched_by: 'slug' | 'link' | 'title'
}

const ANIMEFIRE_BASE = 'https://animefire.plus'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0 Safari/537.36'

async function animefireFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8',
      'Referer': ANIMEFIRE_BASE,
    },
    cache: 'no-store',
  })
}

function formatUrl(url: string): string {
  return url.replace(/\\\//g, '/').replace(/\\/g, '/')
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

export function buildAnimefireSlugCandidates(titles: string[]): string[] {
  const baseSlugs = unique(
    titles
      .map((title) => title.replace(/\([^)]*\)/g, ' '))
      .map(normalizeSlug)
      .filter((slug) => slug.length > 2)
  )

  return unique(
    baseSlugs.flatMap((slug) => [
      slug,
      `${slug}-todos-os-episodios`,
      `${slug}-dublado-todos-os-episodios`,
      `${slug}-legendado-todos-os-episodios`,
    ])
  )
}

export function getSlugFromAnimefireLink(link: string): string | null {
  try {
    const url = new URL(link)
    if (url.hostname !== 'animefire.plus') return null
    const [, section, slug] = url.pathname.split('/')
    if (section !== 'animes' || !slug) return null
    return slug
  } catch {
    return null
  }
}

async function fetchEpisodeSources(slug: string, episode: number): Promise<AnfireEpisode | null> {
  const res = await animefireFetch(`${ANIMEFIRE_BASE}/video/${encodeURIComponent(slug)}/${episode}`)
  if (!res.ok) return null

  const json = await res.json().catch(() => null)
  if (!json || json.response?.status === '500') return null

  const rawSources = Array.isArray(json.data) ? json.data : []
  if (!rawSources.length) {
    return { episode, data: [], status: 'OFFLINE' }
  }

  const sources = rawSources.map((item: { src?: string; label?: string }) => ({
    url: item.src ? formatUrl(item.src) : null,
    resolution: item.label || 'auto',
    status: item.src ? 'ONLINE' as const : 'OFFLINE' as const,
  }))

  return { episode, data: sources }
}

async function fetchAnimefirePage(slug: string): Promise<Partial<AnfireAnime>> {
  const res = await animefireFetch(`${ANIMEFIRE_BASE}/animes/${slug}`)
  if (!res.ok) return {}
  const html = await res.text()
  const cheerio = await import('cheerio')
  const $ = cheerio.load(html)

  return {
    anime_title: $('h1.quicksand400').first().text().trim() || null,
    anime_title1: $('h6.text-gray').first().text().trim() || null,
    anime_image: $('div.sub_animepage_img img').first().attr('data-src') || $('div.sub_animepage_img img').first().attr('src') || null,
    anime_info: $('div.animeInfo a').map((_, el) => $(el).text().trim()).get().filter(Boolean).join(', ') || null,
    anime_synopsis: $('div.divSinopse span.spanAnimeInfo').first().text().trim() || null,
  }
}

export async function fetchAnfireAnimeBySlug(slug: string, maxEpisodes = 80): Promise<AnfireAnime | null> {
  const firstEpisode = await fetchEpisodeSources(slug, 1)
  if (!firstEpisode || (!firstEpisode.data.length && firstEpisode.status === 'OFFLINE')) return null

  const episodes: AnfireEpisode[] = [firstEpisode]
  for (let episode = 2; episode <= maxEpisodes; episode += 1) {
    const data = await fetchEpisodeSources(slug, episode)
    if (!data) break
    episodes.push(data)
    if (!data.data.length && data.status === 'OFFLINE') break
  }

  const pageData = await fetchAnimefirePage(slug).catch(() => ({}))
  return {
    anime_slug: slug,
    ...pageData,
    episodes: episodes.filter((episode) => episode.data.length > 0),
    matched_by: 'slug',
  }
}

export async function findAnfireAnime(params: {
  titles: string[]
  link?: string | null
  slug?: string | null
  maxEpisodes?: number
}): Promise<AnfireAnime | null> {
  const manualSlug = params.slug || (params.link ? getSlugFromAnimefireLink(params.link) : null)
  const candidates = manualSlug ? [manualSlug] : buildAnimefireSlugCandidates(params.titles)
  const maxEpisodes = params.maxEpisodes || 80

  for (const slug of candidates.slice(0, 16)) {
    const anime = await fetchAnfireAnimeBySlug(slug, maxEpisodes)
    if (anime) {
      return {
        ...anime,
        matched_by: manualSlug ? (params.link ? 'link' : 'slug') : 'title',
      }
    }
  }

  return null
}
