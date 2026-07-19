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
  Table,
  Tag,
  Typography,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { CreateKnowledgeArticleInput, KnowledgeArticle } from '@/lib/types';

const { Text, Paragraph } = Typography;

async function fetchArticles(token: string) {
  return api.listKnowledgeArticles(token);
}

export default function KnowledgePage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'GOVERNANCE_LEAD';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchArticles(token)
      .then((data) => {
        if (cancelled) return;
        setArticles(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : 'Failed to load knowledge articles.',
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
    setArticles(await fetchArticles(token));
  };

  const handleCreate = async (values: CreateKnowledgeArticleInput) => {
    if (!token) return;
    setCreating(true);
    try {
      await api.createKnowledgeArticle(token, values);
      void message.success('Article added.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to add the article.',
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
        title="Knowledge Repository"
        extra={
          canManage && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Add Article
            </Button>
          )
        }
      >
        <Table<KnowledgeArticle>
          rowKey="id"
          loading={loading}
          dataSource={articles}
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
              title: 'Tags',
              dataIndex: 'tags',
              render: (tags: string[]) => (
                <>
                  {tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </>
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
        title="Add a Knowledge Article"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateKnowledgeArticleInput>
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
            <Input placeholder="e.g. Retrospective, Playbook, FAQ" />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" open={false} placeholder="Add tags and press enter" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, min: 2 }]}
          >
            <Input.TextArea rows={6} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Add Article
          </Button>
        </Form>
      </Modal>
    </>
  );
}
