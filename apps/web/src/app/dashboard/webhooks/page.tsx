'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { CreateWebhookConnectorInput, WebhookConnector } from '@/lib/types';

async function fetchConnectors(token: string) {
  return api.listWebhookConnectors(token);
}

export default function WebhooksPage() {
  const { token } = useAuth();
  const { message } = App.useApp();
  const [connectors, setConnectors] = useState<WebhookConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchConnectors(token)
      .then((data) => {
        if (cancelled) return;
        setConnectors(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : 'Failed to load webhook connectors.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const reload = async () => {
    if (!token) return;
    setConnectors(await fetchConnectors(token));
  };

  const handleCreate = async (values: CreateWebhookConnectorInput) => {
    if (!token) return;
    setCreating(true);
    try {
      await api.createWebhookConnector(token, values);
      void message.success('Webhook connector added.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the connector.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!token) return;
    try {
      await api.updateWebhookConnector(token, id, { isActive });
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the connector.',
      );
    }
  };

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

      <Card
        style={glassPanelStyle}
        title="Webhook Connectors"
        extra={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Add Connector
          </Button>
        }
      >
        <Table<WebhookConnector>
          rowKey="id"
          loading={loading}
          dataSource={connectors}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            {
              title: 'Provider',
              dataIndex: 'provider',
              render: (provider: string) => (
                <Tag color={semanticColor.brand}>{provider}</Tag>
              ),
            },
            {
              title: 'Active',
              dataIndex: 'isActive',
              render: (isActive: boolean, record) => (
                <Switch
                  checked={isActive}
                  onChange={(checked) => void handleToggleActive(record.id, checked)}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Add a Webhook Connector"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateWebhookConnectorInput>
          layout="vertical"
          onFinish={(values) => void handleCreate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Ops Slack" />
          </Form.Item>
          <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'SLACK', label: 'Slack' },
                { value: 'TEAMS', label: 'Microsoft Teams' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="url"
            label="Incoming webhook URL"
            rules={[{ required: true, type: 'url' }]}
          >
            <Input placeholder="https://hooks.slack.com/services/..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Add Connector
          </Button>
        </Form>
      </Modal>
    </>
  );
}
