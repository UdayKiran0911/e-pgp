'use client';

import { useEffect, useState } from 'react';
import { Alert, Card, Table, Tag, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { semanticColor, spacing } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { AuditLogEntry, PublicUser } from '@/lib/types';

const { Text } = Typography;

async function fetchAuditData(token: string) {
  const [auditLogs, users] = await Promise.all([
    api.listAuditLogs(token),
    api.listUsers(token),
  ]);
  return { auditLogs, users };
}

function actorLabel(actorId: string, users: PublicUser[]): string {
  const actor = users.find((u) => u.id === actorId);
  return actor ? `${actor.name} (${actor.email})` : actorId;
}

export default function AuditLogPage() {
  const { token } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAuditData(token)
      .then(({ auditLogs: logs, users: userList }) => {
        if (cancelled) return;
        setAuditLogs(logs);
        setUsers(userList);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load the audit log.',
        );
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

      <Card style={glassPanelStyle} title="Audit Log">
        <Table<AuditLogEntry>
          rowKey="id"
          loading={loading}
          dataSource={auditLogs}
          pagination={{ pageSize: 20 }}
          columns={[
            {
              title: 'When',
              dataIndex: 'createdAt',
              render: (createdAt: string) => new Date(createdAt).toLocaleString(),
            },
            {
              title: 'Action',
              dataIndex: 'action',
              render: (action: string) => (
                <Tag color={semanticColor.brand}>{action}</Tag>
              ),
            },
            {
              title: 'Actor',
              dataIndex: 'actorId',
              render: (actorId: string) => actorLabel(actorId, users),
            },
            {
              title: 'Project',
              dataIndex: 'project',
              render: (project: AuditLogEntry['project']) =>
                project ? project.name : <Text type="secondary">—</Text>,
            },
            {
              title: 'Details',
              dataIndex: 'metadata',
              render: (metadata: AuditLogEntry['metadata']) =>
                metadata ? (
                  <Text code>{JSON.stringify(metadata)}</Text>
                ) : (
                  <Text type="secondary">—</Text>
                ),
            },
          ]}
        />
      </Card>
    </>
  );
}
