import * as cheerio from 'cheerio'

const ANIMEGO_BASE = 'https://animego.org'
const CVH_API_BASE = 'https://plapi.cdnvideohub.com/api/v1/player/sv'
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0'

export interface AnimegoSearchResult {
  id: string
  slug: string
  link: string
  title: string
  originalTitle: string | null
  image: string | null
  year: number | null
  type: string | null
}

export interface AnimegoEpisode {
  seria: number
  title: string
  airDate: string
  isReleased: boolean
}

export interface AnimegoVoice {
  label: string
  translationId: string
  player: string
  embed: string
  cvhId: string | null
}

export interface AnimegoStream {
  mp4s: string[]
  hls: string | null
  dash: string | null
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const timeoutMs = options.timeout ?? 15000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function isDdosGuardHtml(html: string): boolean {
  return (html.includes('DDoS-Guard') || html.includes('ddos-guard') || html.includes('Cloudflare')) && html.includes('access from')
}

async function fetchWithRetry(url: string, headers: Record<string, string>): Promise<string> {
  const response = await fetchWithTimeout(url, { headers })
  if (!response.ok) throw new Error(`AnimeGO HTTP ${response.status}`)
  let text = await response.text()

  if (isDdosGuardHtml(text)) {
    const cookieRes = await fetch(ANIMEGO_BASE, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'manual',
    })
    const setCookie = cookieRes.headers.get('set-cookie') || ''
    const cookies = setCookie.split(/\s*,\s*/).map(c => c.split(';')[0]).filter(Boolean).join('; ')

    const retryRes = await fetchWithTimeout(url, {
      headers: { ...headers, ...(cookies ? { 'Cookie': cookies } : {}) },
    })
    if (!retryRes.ok) throw new Error(`AnimeGO HTTP ${retryRes.status}`)
    text = await retryRes.text()
  }

  return text
}

async function animegoFetch(url: string): Promise<string> {
  return fetchWithRetry(url, {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  })
}

async function playerFetch(url: string): Promise<string> {
  return fetchWithRetry(url, {
    'User-Agent': USER_AGENT,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/html, */*',
    'Referer': ANIMEGO_BASE + '/',
  })
}

export async function searchAnimego(query: string): Promise<AnimegoSearchResult[]> {
  const html = await animegoFetch(`${ANIMEGO_BASE}/search/anime?q=${encodeURIComponent(query)}`)
  const $ = cheerio.load(html)

  const results: AnimegoSearchResult[] = []

  $('div.ani-grid__item').each((_, el) => {
    const linkEl = $(el).find('a[href*="/anime/"]').first()
    const href = linkEl.attr('href') || ''
    if (!href || !href.startsWith('/anime/')) return

    const path = href.replace(/^\//, '')
    const m = path.match(/^anime\/(.+)-(\d+)$/)
    if (!m) return

    const slug = m[1]
    const animeId = m[2]
    const titleEl = $(el).find('div.ani-grid__item-title a')
    const title = titleEl.first().text().trim() || slug.replace(/-/g, ' ')

    const originalTitle = $(el).find('div.ani-grid__item-body > div.fw-lighter').first().text().trim() || null
    const img = $(el).find('img.image__img').first()
    const image = img.attr('src') || img.attr('data-src') || null

    let year: number | null = null
    let type: string | null = null
    $(el).find('div.ani-grid__item-genres span a').each((_, s) => {
      const text = $(s).text().trim()
      const num = parseInt(text)
      if (!isNaN(num) && num > 1900 && num < 2100) year = num
      else if (text !== '/') type = text
    })

    results.push({
      id: animeId,
      slug,
      link: ANIMEGO_BASE + href,
      title,
      originalTitle,
      image,
      year,
      type,
    })
  })

  return results
}

export async function getAnimegoEpisodes(animeId: string): Promise<AnimegoEpisode[]> {
  const response = await fetchWithTimeout(`${ANIMEGO_BASE}/anime/${animeId}/9999999/schedule/load`, {
    headers: {
      'User-Agent': USER_AGENT,
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': ANIMEGO_BASE + '/',
    },
  })
  if (!response.ok) throw new Error(`AnimeGO HTTP ${response.status}`)
  const raw = await response.text()
  let html: string
  try {
    const data = JSON.parse(raw)
    html = (data?.data?.content || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  } catch {
    html = raw
  }

  const $ = cheerio.load(html)
  const episodes: AnimegoEpisode[] = []

  const divs = $('body > div').first().children('div')
  for (let i = 0; i < divs.length; i += 4) {
    const seriaText = divs.eq(i).attr('data-label') || divs.eq(i).text().trim()
    const seria = parseInt(seriaText.replace(/[.\s]/g, ''))
    if (isNaN(seria)) continue

    episodes.push({
      seria,
      title: divs.eq(i + 1).text().trim() || '---',
      airDate: divs.eq(i + 2).text().trim(),
      isReleased: divs.eq(i + 3).find('div').length > 0 || divs.eq(i + 3).text().trim() !== '',
    })
  }

  return episodes.sort((a, b) => a.seria - b.seria)
}

export async function getAnimegoVoices(animeId: string, episode = 1): Promise<{ voices: AnimegoVoice[]; totalEpisodes: number | null }> {
  const json = await playerFetch(`${ANIMEGO_BASE}/player/${animeId}`)
  let content: string
  try {
    const data = JSON.parse(json)
    content = data?.data?.content || json
    content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
  } catch {
    content = json
  }

  const $ = cheerio.load(content)

  const voices: AnimegoVoice[] = []

  const buttons = $('div#provider button, [data-translation-title]')
  buttons.each((_, el) => {
    const translationId = $(el).attr('data-ptranslation') || ''
    const provider = $(el).attr('data-provider-title') || ''
    const playerUrl = $(el).attr('data-player') || ''
    const name = $(el).attr('data-translation-title') || $(el).text().trim()
    if (!translationId || !name) return

    const label = name.replace(/ \(ошибка\)/g, '').trim()
    const embed = playerUrl ? 'https:' + playerUrl : ''
    let cvhId: string | null = null
    if (embed.includes('cdn-iframe/')) {
      const match = embed.match(/cdn-iframe\/([^/]+)/)
      if (match) cvhId = match[1]
    }

    voices.push({
      label,
      translationId,
      player: provider || 'cvh',
      embed,
      cvhId,
    })
  })

  let totalEpisodes: number | null = null
  const epNums: number[] = []
  $('[data-episode]').each((_, el) => {
    try {
      epNums.push(parseInt($(el).text().trim()))
    } catch {}
  })
  if (epNums.length > 0) totalEpisodes = Math.max(...epNums)

  return { voices, totalEpisodes }
}

export async function cvhGetPlaylist(cvhId: string): Promise<any> {
  const url = `${CVH_API_BASE}/playlist?pub=747&aggr=mali&id=${cvhId}`
  const response = await fetchWithTimeout(url, {
    headers: {
      'Referer': ANIMEGO_BASE + '/',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
    },
  })
  if (!response.ok) throw new Error(`CVH HTTP ${response.status}`)
  const data = await response.json()
  return data.items || []
}

export async function cvhGetStreamByVkId(vkId: string): Promise<AnimegoStream> {
  const url = `${CVH_API_BASE}/video/${vkId}`
  const response = await fetchWithTimeout(url, {
    headers: {
      'Referer': ANIMEGO_BASE + '/',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
    },
  })
  if (!response.ok) throw new Error(`CVH HTTP ${response.status}`)
  const data = await response.json()
  const sources = data.sources || {}

  return {
    mp4s: Object.entries(sources)
      .filter(([k, v]) => k.startsWith('url') && typeof v === 'string' && v.startsWith('http'))
      .map(([_, v]) => v as string),
    hls: sources.hlsUrl || null,
    dash: sources.dashUrl || sources.dashManifestUrl || null,
  }
}

function matchCvhStudio(label: string, studios: string[]): string | null {
  const lo = label.toLowerCase()
  for (const s of studios) {
    if (s.toLowerCase() === lo) return s
  }
  for (const s of studios) {
    const sl = s.toLowerCase()
    if (lo.includes(sl) || sl.includes(lo)) return s
  }
  return null
}

export async function getAnimegoStreamV2(
  cvhId: string,
  season: number,
  episode: number,
  translation: string
): Promise<AnimegoStream> {
  const items = await cvhGetPlaylist(cvhId)
  if (!items || items.length === 0) return { mp4s: [], hls: null, dash: null }

  const seasons = new Map<number, any[]>()
  for (const item of items) {
    const s = item.season || 1
    if (!seasons.has(s)) seasons.set(s, [])
    seasons.get(s)!.push(item)
  }

  if (seasons.size === 1) season = [...seasons.keys()][0]
  const seasonItems = seasons.get(season)
  if (!seasonItems) return { mp4s: [], hls: null, dash: null }

  const epItems = seasonItems.filter((i: any) => i.episode === episode)
  if (epItems.length === 0) return { mp4s: [], hls: null, dash: null }

  const studios = [...new Set(epItems.map((i: any) => i.voiceStudio).filter(Boolean))] as string[]
  const matched = matchCvhStudio(translation, studios)
  const target = matched ? epItems.find((i: any) => i.voiceStudio === matched) : epItems[0]
  if (!target) return { mp4s: [], hls: null, dash: null }

  return cvhGetStreamByVkId(target.vkId)
}
