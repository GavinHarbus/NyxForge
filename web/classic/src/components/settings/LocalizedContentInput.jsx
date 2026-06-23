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

import React, { useMemo, useState } from 'react';
import { Tabs, TabPane, TextArea, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  LOCALIZED_BUCKETS,
  LOCALIZED_DEFAULT_BUCKET,
  serializeLocalizedContent,
  toEditableBuckets,
} from '../../helpers';

const { Text } = Typography;

// 语言名称使用各语言的本名（不翻译）
const LANGUAGE_LABELS = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  fr: 'Français',
  ru: 'Русский',
  ja: '日本語',
  vi: 'Tiếng Việt',
};

/**
 * 多语言内容输入组件。管理员可按语言分别填写内容，组件会序列化为共享的存储格式
 * （仅填写默认分桶时存为纯字符串，否则存为 JSON）。
 */
const LocalizedContentInput = ({
  label,
  placeholder,
  helpText,
  value,
  onChange,
  minRows = 6,
  maxRows = 12,
}) => {
  const { t } = useTranslation();
  const [activeBucket, setActiveBucket] = useState(LOCALIZED_DEFAULT_BUCKET);
  const buckets = useMemo(() => toEditableBuckets(value), [value]);

  const handleBucketChange = (bucket, text) => {
    onChange(serializeLocalizedContent({ ...buckets, [bucket]: text }));
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ marginBottom: 4 }}>
          <Text>{label}</Text>
        </div>
      )}
      <Tabs
        type='line'
        size='small'
        activeKey={activeBucket}
        onChange={(key) => setActiveBucket(key)}
      >
        {LOCALIZED_BUCKETS.map((bucket) => {
          const tabLabel =
            bucket === LOCALIZED_DEFAULT_BUCKET
              ? t('默认（所有语言）')
              : LANGUAGE_LABELS[bucket];
          const isFilled = (buckets[bucket] || '').trim().length > 0;
          return (
            <TabPane
              key={bucket}
              itemKey={bucket}
              tab={
                <span>
                  {tabLabel}
                  {isFilled && (
                    <span
                      style={{
                        marginLeft: 4,
                        color: 'var(--semi-color-primary)',
                      }}
                      aria-hidden
                    >
                      ●
                    </span>
                  )}
                </span>
              }
            >
              <TextArea
                value={buckets[bucket] || ''}
                onChange={(text) => handleBucketChange(bucket, text)}
                placeholder={placeholder}
                style={{ fontFamily: 'JetBrains Mono, Consolas' }}
                autosize={{ minRows, maxRows }}
              />
            </TabPane>
          );
        })}
      </Tabs>
      {helpText && (
        <div style={{ marginTop: 4 }}>
          <Text type='tertiary' size='small'>
            {helpText}
          </Text>
        </div>
      )}
    </div>
  );
};

export default LocalizedContentInput;
