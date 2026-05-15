export function normalizeSearchQuery(value: string): string {
  return value.trim()
}

export function hasCyrillic(value: string): boolean {
  return /[а-яё]/i.test(value)
}

const translitMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export function transliterateRuToLat(value: string): string {
  const lower = value.toLowerCase()
  let result = ''
  for (const char of lower) {
    result += translitMap[char] ?? char
  }
  return result
}

export function buildSearchCandidates(query: string): string[] {
  const cleaned = normalizeSearchQuery(query)
  if (!cleaned) return []
  if (!hasCyrillic(cleaned)) return [cleaned]
  const translit = transliterateRuToLat(cleaned)
  const candidates = [translit, cleaned].filter((value, index, array) => {
    return value && array.indexOf(value) === index
  })
  return candidates.length > 0 ? candidates : [cleaned]
}
