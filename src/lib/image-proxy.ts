const BLOCKED_DOMAINS = [
  'myanimelist.net',
  'cdn.myanimelist.net',
  'shikimori.one',
]

export function getProxiedImageUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  if (BLOCKED_DOMAINS.some(d => url.includes(d))) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }
  return url
}
