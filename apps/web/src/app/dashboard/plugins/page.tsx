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
  Switch,
  Table,
  Typography,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { PluginManifest } from '@/lib/types';

const { Text } = Typography;

interface CreatePluginForm {
  name: string;
  version: string;
  description?: string;
  manifest: string;
}

async function fetchPlugins(token: string) {
  return api.listPlugins(token);
}

export default function PluginsPage() {
  const { token } = useAuth();
  const { message } = App.useApp();
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchPlugins(token)
      .then((data) => {
        if (cancelled) return;
        setPlugins(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load plugins.');
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
    setPlugins(await fetchPlugins(token));
  };

  const handleCreate = async (values: CreatePluginForm) => {
    if (!token) return;
    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(values.manifest) as Record<string, unknown>;
    } catch {
      void message.error('Manifest must be valid JSON.');
      return;
    }
    setCreating(true);
    try {
      await api.createPlugin(token, {
        name: values.name,
        version: values.version,
        description: values.description,
        manifest,
      });
      void message.success('Plugin registered.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to register the plugin.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleToggleEnabled = async (id: string, isEnabled: boolean) => {
    if (!token) return;
    try {
      await api.updatePlugin(token, id, { isEnabled });
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update the plugin.',
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
        title="Plugin Framework"
        extra={
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Register Plugin
          </Button>
        }
      >
        <Table<PluginManifest>
          rowKey="id"
          loading={loading}
          dataSource={plugins}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Version', dataIndex: 'version' },
            {
              title: 'Description',
              dataIndex: 'description',
              render: (description: string | null) =>
                description ?? <Text type="secondary">—</Text>,
            },
            {
              title: 'Enabled',
              dataIndex: 'isEnabled',
              render: (isEnabled: boolean, record) => (
                <Switch
                  checked={isEnabled}
                  onChange={(checked) => void handleToggleEnabled(record.id, checked)}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Register a Plugin"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreatePluginForm>
          layout="vertical"
          initialValues={{ manifest: '{}' }}
          onFinish={(values) => void handleCreate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. jira-sync" />
          </Form.Item>
          <Form.Item name="version" label="Version" rules={[{ required: true }]}>
            <Input placeholder="1.0.0" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="manifest"
            label="Manifest (JSON)"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Register Plugin
          </Button>
        </Form>
      </Modal>
    </>
  );
}
