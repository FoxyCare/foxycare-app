import rawCities from './data/pl-cities.json'

// Sourced from OLX's own Polish city list (1594 towns/cities across all 16
// województwa) — a natural fit for a classifieds-style app, and already the
// list real users are used to seeing on OLX itself.
export interface CityEntry {
  name: string
  voivodeship: string
}

const CITIES = rawCities as CityEntry[]

// Polish users very commonly type without diacritics (different keyboard
// layouts, mobile autocorrect) — "ł" doesn't decompose under NFD like an
// accented Latin letter does, so it needs an explicit swap before the rest
// fall out via combining-mark stripping.
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function searchCities(query: string, limit = 8): CityEntry[] {
  const q = normalize(query.trim())
  if (!q) return []

  const startsWith: CityEntry[] = []
  const contains: CityEntry[] = []

  for (const city of CITIES) {
    const normalized = normalize(city.name)
    if (normalized.startsWith(q)) {
      startsWith.push(city)
    } else if (normalized.includes(q)) {
      contains.push(city)
    }
    if (startsWith.length >= limit) break
  }

  return [...startsWith, ...contains].slice(0, limit)
}
