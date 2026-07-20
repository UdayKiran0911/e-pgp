'use client';

import { useEffect, useState } from 'react';
import { Alert, Card, Table, Tag, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { EmailLog } from '@/lib/types';

const { Text, Paragraph } = Typography;

export default function EmailLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .listEmailLogs(token)
      .then((data) => {
        if (cancelled) return;
        setLogs(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load email logs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <>
      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: spacing[4] }}
        />
      )}

      <Card style={glassPanelStyle} title="Email Log">
        <Text type="secondary">
          Emails are logged here rather than actually sent — the Email Engine
          doesn&apos;t have a real transactional provider wired in yet.
        </Text>
        <Table<EmailLog>
          rowKey="id"
          loading={loading}
          dataSource={logs}
          pagination={{ pageSize: 20 }}
          style={{ marginTop: spacing[4] }}
          columns={[
            {
              title: 'When',
              dataIndex: 'createdAt',
              render: (createdAt: string) => new Date(createdAt).toLocaleString(),
            },
            {
              title: 'To',
              dataIndex: 'recipientEmail',
              render: (email: string) => <Tag color={semanticColor.brand}>{email}</Tag>,
            },
            { title: 'Subject', dataIndex: 'subject' },
            {
              title: 'Body',
              dataIndex: 'body',
              render: (body: string) => (
                <Paragraph
                  ellipsis={{ rows: 1, expandable: true, symbol: 'more' }}
                  style={{ margin: 0 }}
                >
                  {body}
                </Paragraph>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
