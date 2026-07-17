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
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { semanticColor, spacing } from '@epg/design-tokens';
import type { CreateProjectInput, Project, ProjectStatus } from '@/lib/types';

const STATUS_COLOR: Record<ProjectStatus, string> = {
  DRAFT: semanticColor.textSecondary,
  ACTIVE: semanticColor.success,
  ON_HOLD: semanticColor.warning,
  COMPLETED: semanticColor.brand,
  ARCHIVED: semanticColor.textDisabled,
};

// Mirrors the backend's governed lifecycle (apps/api/src/projects/project-status.ts)
// so the UI only ever offers transitions the API will actually accept.
const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'ARCHIVED'],
  ON_HOLD: ['ACTIVE', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};

async function fetchProjects(token: string) {
  return api.listProjects(token);
}

export default function ProjectsPage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'GOVERNANCE_LEAD';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchProjects(token)
      .then((data) => {
        if (cancelled) return;
        setProjects(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load projects.');
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
    setProjects(await fetchProjects(token));
  };

  const handleCreate = async (values: CreateProjectInput) => {
    if (!token) return;
    setCreating(true);
    try {
      await api.createProject(token, values);
      void message.success('Project created.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to create project.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (projectId: string, status: ProjectStatus) => {
    if (!token) return;
    try {
      await api.updateProject(token, projectId, { status });
      void message.success('Project status updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update project status.',
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
        title="Project Portfolio"
        extra={
          canManage && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              New project
            </Button>
          )
        }
      >
        <Table<Project>
          rowKey="id"
          loading={loading}
          dataSource={projects}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            {
              title: 'Status / Health',
              dataIndex: 'status',
              render: (status: ProjectStatus, record) =>
                canManage && ALLOWED_TRANSITIONS[status].length > 0 ? (
                  <Select<ProjectStatus>
                    value={status}
                    size="small"
                    style={{ minWidth: 160 }}
                    options={[
                      { value: status, label: status, disabled: true },
                      ...ALLOWED_TRANSITIONS[status].map((value) => ({
                        value,
                        label: value,
                      })),
                    ]}
                    onChange={(value) => void handleStatusChange(record.id, value)}
                  />
                ) : (
                  <Tag color={STATUS_COLOR[status]}>{status}</Tag>
                ),
            },
            {
              title: 'Created',
              dataIndex: 'createdAt',
              render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
            },
          ]}
        />
      </Card>

      <Modal
        title="New project"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateProjectInput>
          layout="vertical"
          onFinish={(values) => void handleCreate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Create project
          </Button>
        </Form>
      </Modal>
    </>
  );
}
