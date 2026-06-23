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
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  LOCALIZED_BUCKETS,
  LOCALIZED_DEFAULT_BUCKET,
  serializeLocalizedContent,
  toEditableBuckets,
  type LocalizedBucket,
} from '@/lib/localized-content'

const LANGUAGE_LABELS: Record<Exclude<LocalizedBucket, 'default'>, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  fr: 'Français',
  ru: 'Русский',
  ja: '日本語',
  vi: 'Tiếng Việt',
}

type LocalizedTextareaProps = {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

/**
 * A language-aware textarea. Admins author content per language across the
 * canonical buckets; the value is serialized to the shared storage format
 * (plain string when only the `default` bucket is used, JSON otherwise).
 */
export function LocalizedTextarea({
  value,
  onChange,
  rows = 6,
  placeholder,
}: LocalizedTextareaProps) {
  const { t } = useTranslation()
  const [activeBucket, setActiveBucket] = useState<LocalizedBucket>(
    LOCALIZED_DEFAULT_BUCKET
  )
  const buckets = useMemo(() => toEditableBuckets(value), [value])

  const handleBucketChange = (bucket: LocalizedBucket, text: string) => {
    onChange(serializeLocalizedContent({ ...buckets, [bucket]: text }))
  }

  return (
    <Tabs
      value={activeBucket}
      onValueChange={(next) => setActiveBucket(next as LocalizedBucket)}
      className='w-full'
    >
      <TabsList variant='line' className='h-auto flex-wrap justify-start'>
        {LOCALIZED_BUCKETS.map((bucket) => {
          const label =
            bucket === LOCALIZED_DEFAULT_BUCKET
              ? t('Default (all languages)')
              : LANGUAGE_LABELS[bucket]
          const isFilled = (buckets[bucket] ?? '').trim().length > 0
          return (
            <TabsTrigger key={bucket} value={bucket}>
              {label}
              {isFilled && (
                <span
                  className='bg-primary ml-1 inline-block size-1.5 rounded-full'
                  aria-hidden
                />
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
      {LOCALIZED_BUCKETS.map((bucket) => (
        <TabsContent key={bucket} value={bucket} className='mt-2'>
          <Textarea
            value={buckets[bucket] ?? ''}
            onChange={(event) => handleBucketChange(bucket, event.target.value)}
            rows={rows}
            placeholder={placeholder}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}
