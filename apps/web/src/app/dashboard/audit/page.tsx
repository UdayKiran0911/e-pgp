'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { semanticColor, spacing } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type {
  AuditChainVerification,
  AuditLogEntry,
  AuditSummary,
  PublicUser,
} from '@/lib/types';

const { Text } = Typography;

async function fetchAuditData(token: string) {
  const [auditLogs, users, summary] = await Promise.all([
    api.listAuditLogs(token),
    api.listUsers(token),
    api.getAuditSummary(token),
  ]);
  return { auditLogs, users, summary };
}

function actorLabel(actorId: string, users: PublicUser[]): string {
  const actor = users.find((u) => u.id === actorId);
  return actor ? `${actor.name} (${actor.email})` : actorId;
}

export default function AuditLogPage() {
  const { token } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<AuditChainVerification | null>(
    null,
  );

  const handleVerify = async () => {
    if (!token) return;
    setVerifying(true);
    try {
      setVerifyResult(await api.verifyAuditChain(token));
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAuditData(token)
      .then(({ auditLogs: logs, users: userList, summary: summaryData }) => {
        if (cancelled) return;
        setAuditLogs(logs);
        setUsers(userList);
        setSummary(summaryData);
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

      {summary && (
        <Card
          style={{ ...glassPanelStyle, marginBottom: spacing[4] }}
          title="Audit Trail Summary"
          extra={
            <Button
              icon={<SafetyCertificateOutlined />}
              loading={verifying}
              onClick={() => void handleVerify()}
            >
              Verify Integrity
            </Button>
          }
        >
          <Statistic title="Total governed actions" value={summary.totalActions} />
          <Space wrap style={{ marginTop: spacing[3] }}>
            {Object.entries(summary.byAction)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([action, count]) => (
                <Tag key={action} color={semanticColor.brand}>
                  {action}: {count}
                </Tag>
              ))}
          </Space>
          {verifyResult && (
            <Alert
              style={{ marginTop: spacing[3] }}
              type={verifyResult.valid ? 'success' : 'error'}
              showIcon
              title={
                verifyResult.valid
                  ? `Hash chain intact — ${verifyResult.checked} entries verified.`
                  : `Hash chain broken at entry ${verifyResult.brokenAtId} — the audit trail may have been tampered with.`
              }
            />
          )}
        </Card>
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
