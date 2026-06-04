const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
}

export function cleanAnimeDescription(value: string | null | undefined): string {
  if (!value) return ''

  return value
    .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, '$2')
    .replace(/\[\/?(?:character|person|anime|manga|club|topic|spoiler|quote|b|i|u|s|center|right|left|size|color|url)(?:=[^\]]*)?\]/gi, '')
    .replace(/\[[a-z][a-z0-9_-]*(?:=[^\]]*)?\]/gi, '')
    .replace(/\[\/[a-z][a-z0-9_-]*\]/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
      const normalized = entity.toLowerCase()
      if (normalized.startsWith('#x')) return String.fromCodePoint(parseInt(normalized.slice(2), 16))
      if (normalized.startsWith('#')) return String.fromCodePoint(parseInt(normalized.slice(1), 10))
      return HTML_ENTITIES[normalized] || ''
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function normalizeAnimeTitleKey(value: string | null | undefined): string {
  if (!value) return ''

  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/['"`]/g, '')
    .replace(/\s*[:\-–—]\s*(?:season|сезон|part|часть|cour|ova|ona|special|movie|фильм)\s*\d*.*$/i, '')
    .replace(/\b(?:the\s+)?(?:\d+(?:st|nd|rd|th)|[ivx]+)\s+season\b/gi, '')
    .replace(/\bseason\s*\d+\b/gi, '')
    .replace(/\bсезон\s*\d+\b/gi, '')
    .replace(/\b\d+\s*(?:сезон|season)\b/gi, '')
    .replace(/\bpart\s*\d+\b/gi, '')
    .replace(/\bчасть\s*\d+\b/gi, '')
    .replace(/\b(?:ova|ona|special|спецвыпуск|movie|фильм)\b/gi, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}
