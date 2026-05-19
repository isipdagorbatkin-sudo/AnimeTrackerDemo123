import * as cheerio from 'cheerio'

const JUTSU_BASE = 'https://jut.su'
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0'

export interface JutsuAnimeInfo {
  title: string
  originTitle: string
  description: string
  ageRating: string
  poster: string
  genres: string[]
  years: string[]
  seasons: string[][]
  seasonsNames: string[]
  films: string[]
}

export interface JutsuSeasonEpisode {
  season: number
  seasonName: string
  episodes: { number: number; url: string }[]
}

export interface JutsuMp4Links {
  [quality: string]: string
}

export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function generateCandidateSlugs(title: string): string[] {
  const slug = titleToSlug(title)
  const candidates = [slug]

  const parts = slug.split('-')
  if (parts.length > 3) {
    candidates.push(parts.slice(0, 3).join('-'))
    candidates.push(parts.slice(0, 2).join('-'))
  }

  const withoutParticles = parts.filter(p => !['de', 'no', 'wa', 'ga', 'ni', 'o', 'wo', 'to', 'ka', 'ya', 'no', 'da', 'desu', 'dasi'].includes(p)).join('-')
  if (withoutParticles && withoutParticles !== slug) candidates.push(withoutParticles)

  return [...new Set(candidates)]
}

export function buildJutsuUrl(slug: string): string {
  return `${JUTSU_BASE}/${slug}/`
}

export function buildEpisodeUrl(slug: string, episodeNum: number): string {
  return `${JUTSU_BASE}/${slug}/episode-${episodeNum}.html`
}

export function buildSeasonEpisodeUrl(slug: string, season: number, episodeNum: number): string {
  return `${JUTSU_BASE}/${slug}/season-${season}/episode-${episodeNum}.html`
}

async function jutsuFetch(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const proxyUrl = process.env.JUTSU_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`JutSu HTTP ${response.status}`)
    return response.text()
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchAnimeInfo(url: string): Promise<JutsuAnimeInfo> {
  const html = await jutsuFetch(url)
  const $ = cheerio.load(html)

  const titleTag = $('h1.header_video')
  let title = titleTag.text().trim()
  title = title
    .replace('Смотреть ', '')
    .replace(' все серии и сезоны', '')
    .replace(' все серии', '')
    .trim()

  let originTitle = ''
  const shortstoryDiv = $('div.shortstory, div.anime_pages').first()
  shortstoryDiv.find('p').each((_, el) => {
    const text = $(el).text().trim()
    if (text.includes('Оригинальное название') || text.includes('Оригiнальна назва')) {
      originTitle = text.replace(/^.*?:\s*/, '').trim()
    }
  })

  let description = ''
  const descDiv = $('div.description, div[itemprop="description"]').first()
  if (descDiv.length) {
    description = descDiv.text().trim()
  }

  let ageRating = ''
  $('div.age, span.age').each((_, el) => {
    const text = $(el).text().trim()
    if (text) ageRating = text
  })

  let poster = ''
  const posterImg = $('img.poster, img[itemprop="image"]').first()
  if (posterImg.length) {
    const src = posterImg.attr('src')
    if (src) {
      poster = src.startsWith('http') ? src : `https:${src}`
    }
  }

  const genres: string[] = []
  const years: string[] = []
  const allLinks = $('a')
  allLinks.each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().trim()
    if (!href || !text) return
    if (href === url || href === '/') return
    if (/\/\d{4}(-\d{4})?\//.test(href)) {
      if (!years.includes(text)) years.push(text)
    } else if (!href.includes('javascript') && !href.startsWith('#') && !href.startsWith('http')) {
      if (!genres.includes(text) && text.length < 30) genres.push(text)
    }
  })

  const seasons: string[][] = []
  const seasonsNames: string[] = []
  const films: string[] = []
  let currentSeasonIdx = 0

  $('a.video').each((_, el) => {
    const href = $(el).attr('href') || ''
    const text = $(el).text().trim()

    if (href.includes('season')) {
      const match = href.match(/season-(\d+)/)
      if (match) {
        const seasonNum = parseInt(match[1])
        while (seasons.length < seasonNum) {
          seasons.push([])
          seasonsNames.push('')
        }
        currentSeasonIdx = seasonNum - 1
        if (text) seasonsNames[currentSeasonIdx] = text
      }
    } else if (href.includes('film')) {
      films.push(href)
    } else {
      if (seasons.length === 0) {
        seasons.push([])
        seasonsNames.push('')
      }
      seasons[currentSeasonIdx].push(href)
    }
  })

  if (seasons.length === 0) {
    const episodeLinks: string[] = []
    $('a.video').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (href) episodeLinks.push(href)
    })
    if (episodeLinks.length > 0) {
      seasons.push(episodeLinks)
      seasonsNames.push('')
    }
  }

  return {
    title,
    originTitle,
    description,
    ageRating,
    poster,
    genres,
    years,
    seasons,
    seasonsNames,
    films,
  }
}

export async function fetchMp4Links(url: string): Promise<JutsuMp4Links> {
  const html = await jutsuFetch(url)
  const $ = cheerio.load(html)

  const qualities: JutsuMp4Links = {}

  $('video#my-player source, video source').each((_, el) => {
    const res = $(el).attr('res') || $(el).attr('data-res') || ''
    let src = $(el).attr('src') || ''
    if (res && src) {
      if (src.startsWith('//')) src = `https:${src}`
      else if (src.startsWith('/')) src = `${JUTSU_BASE}${src}`
      qualities[res] = src
    }
  })

  return qualities
}

export async function findJutsuUrl(titles: string[]): Promise<string | null> {
  for (const title of titles) {
    if (!title) continue
    const candidates = generateCandidateSlugs(title)
    for (const slug of candidates) {
      if (!slug) continue
      const url = buildJutsuUrl(slug)
      try {
        const html = await jutsuFetch(url)
        const $ = cheerio.load(html)
        const hasVideo = $('a.video').length > 0
        if (hasVideo) return url
      } catch {
        continue
      }
    }
  }
  return null
}

export async function getSeasonEpisodeData(url: string): Promise<JutsuSeasonEpisode[]> {
  const info = await fetchAnimeInfo(url)
  return info.seasons.map((episodes, idx) => ({
    season: idx + 1,
    seasonName: info.seasonsNames[idx] || `Сезон ${idx + 1}`,
    episodes: episodes.map((epUrl, epIdx) => ({
      number: epIdx + 1,
      url: epUrl.startsWith('http') ? epUrl : `${JUTSU_BASE}${epUrl.startsWith('/') ? '' : '/'}${epUrl}`,
    })),
  }))
}
