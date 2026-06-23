/*
Copyright (C) 2025 QuantumNous

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

import { normalizeLanguage } from '../i18n/language';

/**
 * Admin-authored content (home page, about, user agreement, privacy policy) can
 * be stored either as a legacy plain string (HTML / Markdown / URL that applies
 * to every language) or as a canonical JSON object keyed by language bucket.
 *
 * The `default` bucket is the catch-all shown when the viewer's language has no
 * dedicated entry. Both web/default and web/classic read the same backend
 * option, so these canonical buckets must stay in sync across both frontends.
 */
export const LOCALIZED_DEFAULT_BUCKET = 'default';

export const LOCALIZED_LANGUAGE_BUCKETS = [
  'en',
  'zh-CN',
  'zh-TW',
  'fr',
  'ru',
  'ja',
  'vi',
];

export const LOCALIZED_BUCKETS = [
  LOCALIZED_DEFAULT_BUCKET,
  ...LOCALIZED_LANGUAGE_BUCKETS,
];

const BUCKET_SET = new Set(LOCALIZED_BUCKETS);

/** Map an i18next UI language to its canonical language bucket. */
export function toLocalizedBucket(language) {
  const normalized = normalizeLanguage((language || '').trim());
  return LOCALIZED_LANGUAGE_BUCKETS.includes(normalized) ? normalized : 'en';
}

/**
 * Parse a stored raw string into a localized map, or `null` when it is a legacy
 * plain string (HTML / Markdown / URL) that should apply to every language.
 */
export function parseLocalizedContent(raw) {
  const value = (raw || '').trim();
  if (!value.startsWith('{')) return null;

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const entries = Object.entries(parsed);
  if (entries.length === 0) return null;
  for (const [key, val] of entries) {
    if (!BUCKET_SET.has(key)) return null;
    if (typeof val !== 'string') return null;
  }

  return parsed;
}

function firstNonEmptyBucket(map) {
  for (const bucket of LOCALIZED_BUCKETS) {
    const value = map[bucket];
    if (value && value.trim()) return value;
  }
  return '';
}

function fallbackChain(bucket) {
  if (bucket === 'zh-CN') return ['zh-CN', 'zh-TW', LOCALIZED_DEFAULT_BUCKET];
  if (bucket === 'zh-TW') return ['zh-TW', 'zh-CN', LOCALIZED_DEFAULT_BUCKET];
  return [bucket, LOCALIZED_DEFAULT_BUCKET];
}

/** Resolve the content to display for the given UI language. */
export function resolveLocalizedContent(raw, language) {
  const map = parseLocalizedContent(raw);
  if (!map) {
    const value = raw || '';
    return value.trim() ? value : '';
  }

  for (const candidate of fallbackChain(toLocalizedBucket(language))) {
    const value = map[candidate];
    if (value && value.trim()) return value;
  }
  if (map.en && map.en.trim()) return map.en;
  return firstNonEmptyBucket(map);
}

/**
 * Expand a stored value into editable buckets. A legacy plain string is placed
 * in the `default` bucket so existing content keeps rendering for all languages.
 */
export function toEditableBuckets(raw) {
  const result = {};
  for (const bucket of LOCALIZED_BUCKETS) result[bucket] = '';

  const map = parseLocalizedContent(raw);
  if (!map) {
    result[LOCALIZED_DEFAULT_BUCKET] = raw || '';
    return result;
  }

  for (const bucket of LOCALIZED_BUCKETS) {
    const value = map[bucket];
    if (typeof value === 'string') result[bucket] = value;
  }
  return result;
}

/**
 * Serialize edited buckets back to a storage string. When only the `default`
 * bucket is filled the plain string is stored (backward compatible); otherwise
 * a JSON object is stored with empty buckets omitted and a stable key order.
 */
export function serializeLocalizedContent(buckets) {
  const filled = LOCALIZED_BUCKETS.filter(
    (bucket) => (buckets[bucket] || '').trim().length > 0,
  );
  if (filled.length === 0) return '';
  if (filled.length === 1 && filled[0] === LOCALIZED_DEFAULT_BUCKET) {
    return buckets[LOCALIZED_DEFAULT_BUCKET];
  }

  const map = {};
  for (const bucket of LOCALIZED_BUCKETS) {
    const value = buckets[bucket];
    if (value && value.length > 0) map[bucket] = value;
  }
  return JSON.stringify(map);
}
