'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Empty, Input, List, Tag, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { SearchResult } from '@/lib/types';

const { Text } = Typography;

export default function SearchPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (value: string) => {
    if (!token || value.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      setResults(await api.search(token, value));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={glassPanelStyle} title="Enterprise Search">
      <Input.Search
        placeholder="Search risks, decisions, requirements, documents, SOPs, knowledge articles..."
        allowClear
        loading={loading}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={(value) => void handleSearch(value)}
        style={{ marginBottom: spacing[4] }}
      />

      {error && <Text type="danger">{error}</Text>}

      {searched && !loading && results.length === 0 && !error && (
        <Empty description="No matches." />
      )}

      <List<SearchResult>
        dataSource={results}
        renderItem={(result) => (
          <List.Item>
            <List.Item.Meta
              title={
                <>
                  <Tag color={semanticColor.brand}>{result.type}</Tag>
                  {result.projectId ? (
                    <Link href={`/dashboard/projects/${result.projectId}`}>
                      {result.title}
                    </Link>
                  ) : (
                    <Text strong>{result.title}</Text>
                  )}
                </>
              }
              description={result.snippet}
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
