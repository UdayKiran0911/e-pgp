'use client';

import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Modal, Table, Tag, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { CreateSopInput, Sop } from '@/lib/types';

const { Text, Paragraph } = Typography;

async function fetchSops(token: string) {
  return api.listSops(token);
}

export default function SopsPage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'GOVERNANCE_LEAD';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchSops(token)
      .then((data) => {
        if (cancelled) return;
        setSops(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load SOPs.');
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
    setSops(await fetchSops(token));
  };

  const handleCreate = async (values: CreateSopInput) => {
    if (!token) return;
    setCreating(true);
    try {
      await api.createSop(token, values);
      void message.success('SOP added.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the SOP.',
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
        title="SOP Library"
        extra={
          canManage && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Add SOP
            </Button>
          )
        }
      >
        <Table<Sop>
          rowKey="id"
          loading={loading}
          dataSource={sops}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title' },
            {
              title: 'Category',
              dataIndex: 'category',
              render: (category: string) => (
                <Tag color={semanticColor.brand}>{category}</Tag>
              ),
            },
            {
              title: 'Content',
              dataIndex: 'content',
              render: (content: string) => (
                <Paragraph
                  ellipsis={{ rows: 1, expandable: true, symbol: 'more' }}
                  style={{ margin: 0 }}
                >
                  <Text>{content}</Text>
                </Paragraph>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Add a SOP"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateSopInput>
          layout="vertical"
          onFinish={(values) => void handleCreate(values)}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, min: 2 }]}
          >
            <Input placeholder="e.g. Security, Deployment, Onboarding" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, min: 2 }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Add SOP
          </Button>
        </Form>
      </Modal>
    </>
  );
}
