/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Admin-authored content (home page, about, user agreement, privacy policy) can
 * be stored either as a legacy plain string (HTML / Markdown / URL that applies
 * to every language) or as a canonical JSON object keyed by language bucket.
 *
 * The `default` bucket is the catch-all shown when the viewer's language has no
 * dedicated entry. Both web/default and web/classic read the same backend
 * option, so these canonical buckets must stay in sync across both frontends.
 */
export const LOCALIZED_DEFAULT_BUCKET = 'default'

export const LOCALIZED_LANGUAGE_BUCKETS = [
  'en',
  'zh-CN',
  'zh-TW',
  'fr',
  'ru',
  'ja',
  'vi',
] as const

export type LocalizedLanguageBucket = (typeof LOCALIZED_LANGUAGE_BUCKETS)[number]

export type LocalizedBucket =
  | typeof LOCALIZED_DEFAULT_BUCKET
  | LocalizedLanguageBucket

export const LOCALIZED_BUCKETS: LocalizedBucket[] = [
  LOCALIZED_DEFAULT_BUCKET,
  ...LOCALIZED_LANGUAGE_BUCKETS,
]

export type LocalizedContentMap = Partial<Record<LocalizedBucket, string>>

const BUCKET_SET = new Set<string>(LOCALIZED_BUCKETS)

/** Map an i18next UI language to its canonical language bucket. */
export function toLocalizedBucket(
  language?: string | null
): LocalizedLanguageBucket {
  const raw = (language ?? '').trim().replace(/_/g, '-').toLowerCase()
  if (!raw) return 'en'
  if (
    raw === 'zh' ||
    raw === 'zh-cn' ||
    raw === 'zh-sg' ||
    raw.startsWith('zh-hans')
  ) {
    return 'zh-CN'
  }
  if (
    raw === 'zh-tw' ||
    raw === 'zh-hk' ||
    raw === 'zh-mo' ||
    raw.startsWith('zh-hant')
  ) {
    return 'zh-TW'
  }
  const base = raw.split('-')[0]
  const match = LOCALIZED_LANGUAGE_BUCKETS.find(
    (bucket) => bucket.toLowerCase() === raw || bucket.toLowerCase() === base
  )
  return match ?? 'en'
}

/**
 * Parse a stored raw string into a localized map, or `null` when it is a legacy
 * plain string (HTML / Markdown / URL) that should apply to every language.
 */
export function parseLocalizedContent(
  raw: string | null | undefined
): LocalizedContentMap | null {
  const value = (raw ?? '').trim()
  if (!value.startsWith('{')) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null
  }

  const entries = Object.entries(parsed as Record<string, unknown>)
  if (entries.length === 0) return null
  for (const [key, val] of entries) {
    if (!BUCKET_SET.has(key)) return null
    if (typeof val !== 'string') return null
  }

  return parsed as LocalizedContentMap
}

function firstNonEmptyBucket(map: LocalizedContentMap): string {
  for (const bucket of LOCALIZED_BUCKETS) {
    const value = map[bucket]
    if (value && value.trim()) return value
  }
  return ''
}

function fallbackChain(bucket: LocalizedLanguageBucket): LocalizedBucket[] {
  if (bucket === 'zh-CN') return ['zh-CN', 'zh-TW', LOCALIZED_DEFAULT_BUCKET]
  if (bucket === 'zh-TW') return ['zh-TW', 'zh-CN', LOCALIZED_DEFAULT_BUCKET]
  return [bucket, LOCALIZED_DEFAULT_BUCKET]
}

/** Resolve the content to display for the given UI language. */
export function resolveLocalizedContent(
  raw: string | null | undefined,
  language?: string | null
): string {
  const map = parseLocalizedContent(raw)
  if (!map) {
    const value = raw ?? ''
    return value.trim() ? value : ''
  }

  for (const candidate of fallbackChain(toLocalizedBucket(language))) {
    const value = map[candidate]
    if (value && value.trim()) return value
  }
  if (map.en && map.en.trim()) return map.en
  return firstNonEmptyBucket(map)
}

/**
 * Expand a stored value into editable buckets. A legacy plain string is placed
 * in the `default` bucket so existing content keeps rendering for all languages.
 */
export function toEditableBuckets(
  raw: string | null | undefined
): Record<LocalizedBucket, string> {
  const result = Object.fromEntries(
    LOCALIZED_BUCKETS.map((bucket) => [bucket, ''])
  ) as Record<LocalizedBucket, string>

  const map = parseLocalizedContent(raw)
  if (!map) {
    result[LOCALIZED_DEFAULT_BUCKET] = raw ?? ''
    return result
  }

  for (const bucket of LOCALIZED_BUCKETS) {
    const value = map[bucket]
    if (typeof value === 'string') result[bucket] = value
  }
  return result
}

/**
 * Serialize edited buckets back to a storage string. When only the `default`
 * bucket is filled the plain string is stored (backward compatible); otherwise
 * a JSON object is stored with empty buckets omitted and a stable key order.
 */
export function serializeLocalizedContent(
  buckets: Record<LocalizedBucket, string>
): string {
  const filled = LOCALIZED_BUCKETS.filter(
    (bucket) => (buckets[bucket] ?? '').trim().length > 0
  )
  if (filled.length === 0) return ''
  if (filled.length === 1 && filled[0] === LOCALIZED_DEFAULT_BUCKET) {
    return buckets[LOCALIZED_DEFAULT_BUCKET]
  }

  const map: LocalizedContentMap = {}
  for (const bucket of LOCALIZED_BUCKETS) {
    const value = buckets[bucket]
    if (value && value.length > 0) map[bucket] = value
  }
  return JSON.stringify(map)
}

/** Resolve stored content reactively to the current UI language. */
export function useLocalizedContent(raw: string | null | undefined): string {
  const { i18n } = useTranslation()
  return useMemo(
    () => resolveLocalizedContent(raw, i18n.language),
    [raw, i18n.language]
  )
}
