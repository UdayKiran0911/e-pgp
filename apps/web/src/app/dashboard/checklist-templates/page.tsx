'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  List,
  Modal,
  Select,
  Table,
  Typography,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { ChecklistTemplate, CreateChecklistTemplateInput } from '@/lib/types';

const { Text } = Typography;

interface CreateTemplateForm {
  name: string;
  description?: string;
  items: string[];
}

async function fetchTemplates(token: string) {
  return api.listChecklistTemplates(token);
}

export default function ChecklistTemplatesPage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'GOVERNANCE_LEAD';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchTemplates(token)
      .then((data) => {
        if (cancelled) return;
        setTemplates(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load templates.');
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
    setTemplates(await fetchTemplates(token));
  };

  const handleCreate = async (values: CreateTemplateForm) => {
    if (!token) return;
    const input: CreateChecklistTemplateInput = {
      name: values.name,
      description: values.description,
      items: values.items,
    };
    setCreating(true);
    try {
      await api.createChecklistTemplate(token, input);
      void message.success('Template created.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to create the template.',
      );
    } finally {
      setCreating(false);
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
        title="Checklist Templates"
        extra={
          canManage && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Add Template
            </Button>
          )
        }
      >
        <Table<ChecklistTemplate>
          rowKey="id"
          loading={loading}
          dataSource={templates}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            {
              title: 'Description',
              dataIndex: 'description',
              render: (description: string | null) =>
                description ?? <Text type="secondary">—</Text>,
            },
            {
              title: 'Items',
              dataIndex: 'items',
              render: (items: ChecklistTemplate['items']) => (
                <List
                  size="small"
                  dataSource={items}
                  renderItem={(item) => <List.Item>{item.title}</List.Item>}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Add a Checklist Template"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateTemplateForm>
          layout="vertical"
          onFinish={(values) => void handleCreate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input placeholder="e.g. Pre-launch checklist" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="items"
            label="Items (in order)"
            rules={[{ required: true, message: 'Add at least one item' }]}
          >
            <Select mode="tags" open={false} placeholder="Type an item and press enter" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Add Template
          </Button>
        </Form>
      </Modal>
    </>
  );
}
