'use client';

import { useEffect, useState } from 'react';
import { Alert, Card, Col, Progress, Row, Space, Statistic, Table, Tag } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { AnalyticsOverview } from '@/lib/types';

const REGISTER_LABEL: Record<string, string> = {
  risks: 'Risks',
  issues: 'Issues',
  decisions: 'Decisions',
  requirements: 'Requirements',
  reviews: 'Reviews',
  changeRequests: 'Change Requests',
  documents: 'Documents',
  sops: 'SOPs',
  knowledgeArticles: 'Knowledge Articles',
  securityFindings: 'Security Findings',
};

function scoreColor(score: number): string {
  if (score >= 80) return semanticColor.success;
  if (score >= 50) return semanticColor.warning;
  return semanticColor.danger;
}

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getAnalyticsOverview(token)
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load analytics.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const adoptionRows = overview
    ? Object.entries(overview.adoption).map(([key, counts]) => ({
        key,
        label: REGISTER_LABEL[key] ?? key,
        ...counts,
      }))
    : [];

  return (
    <Space orientation="vertical" size={parseInt(spacing[6], 10)} style={{ width: '100%' }}>
      {error && <Alert type="error" title={error} showIcon />}

      <Row gutter={[parseInt(spacing[4], 10), parseInt(spacing[4], 10)]}>
        <Col xs={24} md={12}>
          <Card style={glassPanelStyle} title="Governance Health" loading={loading}>
            {overview && (
              <>
                <Statistic
                  title="Average project score"
                  value={overview.governanceHealth.averageScore}
                  suffix="/ 100"
                  valueStyle={{ color: scoreColor(overview.governanceHealth.averageScore) }}
                />
                <Space style={{ marginTop: spacing[3] }}>
                  <Tag color={semanticColor.success}>
                    Healthy: {overview.governanceHealth.healthy}
                  </Tag>
                  <Tag color={semanticColor.warning}>
                    At risk: {overview.governanceHealth.atRisk}
                  </Tag>
                  <Tag color={semanticColor.danger}>
                    Critical: {overview.governanceHealth.critical}
                  </Tag>
                </Space>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card style={glassPanelStyle} title="Audit Readiness" loading={loading}>
            {overview && (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <div>
                  Governance gates met
                  <Progress
                    percent={Math.round(overview.auditReadiness.gateCompletionRate * 100)}
                  />
                </div>
                <div>
                  Customer sign-offs received
                  <Progress
                    percent={Math.round(
                      overview.auditReadiness.signoffCompletionRate * 100,
                    )}
                  />
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={glassPanelStyle} title="Adoption" loading={loading}>
        <Table
          rowKey="key"
          dataSource={adoptionRows}
          pagination={false}
          columns={[
            { title: 'Register', dataIndex: 'label' },
            { title: 'Total', dataIndex: 'total' },
            { title: 'Last 30 days', dataIndex: 'last30Days' },
          ]}
        />
      </Card>
    </Space>
  );
}
