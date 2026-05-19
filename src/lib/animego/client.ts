import * as cheerio from 'cheerio'

const ANIMEGO_BASE = 'https://animego.org'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'

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

export interface AnimegoAnimeInfo {
  title: string
  otherTitles: string
  image: string
  score: string
  type: string
  episodes: string
  genres: string[]
  status: string
  duration: string
  studio: string
  description: string
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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function animegoFetch(url: string, accept = 'text/html'): Promise<string> {
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': `${accept},application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`,
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })
  if (!response.ok) throw new Error(`AnimeGO HTTP ${response.status}`)
  return response.text()
}

export async function searchAnimego(query: string): Promise<AnimegoSearchResult[]> {
  const html = await animegoFetch(`${ANIMEGO_BASE}/anime?search=${encodeURIComponent(query)}`)
  const $ = cheerio.load(html)

  const results: AnimegoSearchResult[] = []

  $('.ani-list__item').each((_, el) => {
    const linkEl = $(el).find('a.ani-list__item-title a, a.text-line-clamp[href*="/anime/"]').first()
    const link = linkEl.attr('href') || ''
    if (!link || !link.includes('/anime/')) return

    const cleanPath = link.startsWith('/') ? link.slice(1) : link
    const idMatch = cleanPath.match(/-(\d+)$/)
    const slugMatch = cleanPath.match(/anime\/([^/]+)/)

    const title = $(el).find('a.text-line-clamp').first().text().trim()
    const originalTitle = $(el).find('.fw-lighter.small, .fw-lighter.small.mb-2').first().text().trim() || null
    const img = $(el).find('img.image__img').first()
    const image = img.attr('src') || img.attr('data-src') || null

    let year: number | null = null
    $(el).find('a[href^="/anime/season/"]').each((_, y) => {
      const yText = $(y).text().trim()
      const yNum = parseInt(yText)
      if (!isNaN(yNum) && yNum > 1900 && yNum < 2100) year = yNum
    })

    let type: string | null = null
    $(el).find('a[href^="/anime/type/"]').each((_, t) => {
      type = $(t).text().trim()
    })

    if (!title) return

    results.push({
      id: idMatch?.[1] || slugMatch?.[1] || '',
      slug: slugMatch?.[1] || '',
      link: link.startsWith('http') ? link : `${ANIMEGO_BASE}${link}`,
      title,
      originalTitle,
      image,
      year,
      type,
    })
  })

  return results
}

export async function getAnimegoInfo(url: string): Promise<AnimegoAnimeInfo> {
  const html = await animegoFetch(url)
  const $ = cheerio.load(html)

  const title = $('h1').first().text().trim()
  const image = $('.anime-poster img, [itemprop="image"]').first().attr('src') || $('.anime-poster img').first().attr('data-src') || ''

  const info: AnimegoAnimeInfo = {
    title,
    otherTitles: $('.other-titles, .alternative-title').first().text().trim(),
    image,
    score: $('.rating-value, .score, [itemprop="ratingValue"]').first().text().trim(),
    type: '',
    episodes: '',
    genres: [],
    status: '',
    duration: '',
    studio: '',
    description: $('.description, [itemprop="description"]').first().text().trim(),
  }

  $('.anime-info-item, .media-info-item, .list-group-item').each((_, el) => {
    const label = $(el).find('dt, .label, strong, .title').first().text().trim().toLowerCase()
    const value = $(el).find('dd, .value, .text').first().text().trim()

    if (label.includes('тип')) info.type = value
    else if (label.includes('эпизод')) info.episodes = value
    else if (label.includes('жанр')) {
      $(el).find('a, span').each((_, g) => {
        const genreText = $(g).text().trim()
        if (genreText) info.genres.push(genreText)
      })
    }
    else if (label.includes('статус')) info.status = value
    else if (label.includes('длитель')) info.duration = value
    else if (label.includes('студия')) info.studio = value
  })

  return info
}

export async function getAnimegoEpisodes(animeId: string): Promise<AnimegoEpisode[]> {
  const html = await animegoFetch(`${ANIMEGO_BASE}/anime/${animeId}/episodes`)
  const $ = cheerio.load(html)

  const episodes: AnimegoEpisode[] = []

  $('tr, .episode-item').each((_, el) => {
    const seriaText = $(el).find('.episode-number, td:first-child, .number').first().text().trim()
    const seria = parseInt(seriaText)
    if (isNaN(seria)) return

    episodes.push({
      seria,
      title: $(el).find('.episode-title, td:nth-child(2), .title').first().text().trim() || '---',
      airDate: $(el).find('.episode-date, td:nth-child(3), .date').first().text().trim(),
      isReleased: !$(el).find('.not-released, .future, .badge-warning').length,
    })
  })

  return episodes
}

export async function getAnimegoVoices(animeId: string, episode = 1): Promise<{ voices: AnimegoVoice[]; totalEpisodes: number | null }> {
  const html = await animegoFetch(`${ANIMEGO_BASE}/anime/${animeId}/player?episode=${episode}`)
  const $ = cheerio.load(html)

  const voices: AnimegoVoice[] = []
  let totalEpisodes: number | null = null

  const totalText = $('.episodes-total, .total-episodes, [data-total]').first().attr('data-total') || $('.episodes-total').first().text()
  const totalMatch = totalText.match(/\d+/)
  if (totalMatch) totalEpisodes = parseInt(totalMatch[0])

  $('[data-translation-id]').each((_, el) => {
    const translationId = $(el).attr('data-translation-id') || ''
    const label = $(el).text().trim() || $(el).attr('title') || ''
    const player = $(el).attr('data-player') || 'cvh'

    voices.push({
      label,
      translationId,
      player,
      embed: $(el).attr('data-embed') || $(el).find('iframe').attr('src') || '',
      cvhId: $(el).attr('data-cvh-id') || null,
    })
  })

  if (voices.length === 0) {
    $('select option').each((_, el) => {
      const val = $(el).attr('value') || ''
      const label = $(el).text().trim()
      if (val && label && val !== '0') {
        voices.push({
          label,
          translationId: val,
          player: 'cvh',
          embed: '',
          cvhId: null,
        })
      }
    })
  }

  return { voices, totalEpisodes }
}

export async function getAnimegoStream(
  cvhId: string,
  season: number,
  episode: number,
  translation: string
): Promise<AnimegoStream> {
  try {
    const apiUrl = `${ANIMEGO_BASE}/api/stream/cvh/${cvhId}?season=${season}&episode=${episode}&translation=${encodeURIComponent(translation)}`
    const response = await fetchWithTimeout(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return {
        mp4s: data.mp4s || data.MP4s || [],
        hls: data.hls || data.HLS || null,
        dash: data.dash || data.DASH || null,
      }
    }
  } catch {}

  return { mp4s: [], hls: null, dash: null }
}
