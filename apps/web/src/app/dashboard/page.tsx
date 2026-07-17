'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, semanticColor } from '@epg/design-tokens';
import type {
  CreateUserInput,
  Organization,
  PublicUser,
  Role,
} from '@/lib/types';

const { Title } = Typography;

const ROLE_COLOR: Record<Role, string> = {
  ADMIN: semanticColor.brand,
  GOVERNANCE_LEAD: semanticColor.warning,
  MEMBER: semanticColor.textSecondary,
  AUDITOR: semanticColor.success,
};

const ASSIGNABLE_ROLES: Role[] = ['ADMIN', 'GOVERNANCE_LEAD', 'MEMBER', 'AUDITOR'];

/** Pure data fetch — no React state here, so it's safe to call from an effect. */
async function fetchDashboardData(token: string) {
  const [organization, users] = await Promise.all([
    api.getMyOrganization(token),
    api.listUsers(token),
  ]);
  return { organization, users };
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchDashboardData(token)
      .then(({ organization: org, users: userList }) => {
        if (cancelled) return;
        setOrganization(org);
        setUsers(userList);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Used to refresh the table after a mutation (invite/role change/toggle) —
  // called from event handlers only, never from an effect.
  const reload = useCallback(async () => {
    if (!token) return;
    const { organization: org, users: userList } = await fetchDashboardData(token);
    setOrganization(org);
    setUsers(userList);
  }, [token]);

  const handleInvite = async (values: CreateUserInput) => {
    if (!token) return;
    setInviting(true);
    try {
      await api.createUser(token, values);
      void message.success('User invited.');
      setInviteOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to invite user.',
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, role: Role) => {
    if (!token) return;
    try {
      await api.updateUser(token, targetUserId, { role });
      void message.success('Role updated.');
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update role.',
      );
    }
  };

  const handleToggleActive = async (targetUser: PublicUser) => {
    if (!token) return;
    try {
      await api.updateUser(token, targetUser.id, {
        isActive: !targetUser.isActive,
      });
      void message.success(
        targetUser.isActive ? 'User deactivated.' : 'User reactivated.',
      );
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update user.',
      );
    }
  };

  return (
    <Space orientation="vertical" size={parseInt(spacing[6], 10)} style={{ width: '100%' }}>
      {error && <Alert type="error" title={error} showIcon />}

      <Card>
        <Title level={4} style={{ margin: 0 }}>
          {organization?.name ?? 'Organization'}
        </Title>
      </Card>

      <Card
        title="Members"
        extra={
          isAdmin && (
            <Button type="primary" onClick={() => setInviteOpen(true)}>
              Invite user
            </Button>
          )
        }
      >
        <Table<PublicUser>
          rowKey="id"
          loading={loading}
          dataSource={users}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name' },
            { title: 'Email', dataIndex: 'email' },
            {
              title: 'Role',
              dataIndex: 'role',
              render: (role: Role, record) =>
                isAdmin && record.id !== user?.id ? (
                  <Select<Role>
                    value={role}
                    size="small"
                    style={{ minWidth: 160 }}
                    options={ASSIGNABLE_ROLES.map((value) => ({
                      value,
                      label: value,
                    }))}
                    onChange={(value) => void handleRoleChange(record.id, value)}
                  />
                ) : (
                  <Tag color={ROLE_COLOR[role]}>{role}</Tag>
                ),
            },
            {
              title: 'Status',
              dataIndex: 'isActive',
              render: (isActive: boolean) =>
                isActive ? (
                  <Tag color={semanticColor.success}>Active</Tag>
                ) : (
                  <Tag color={semanticColor.danger}>Inactive</Tag>
                ),
            },
            ...(isAdmin
              ? [
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_: unknown, record: PublicUser) =>
                      record.id !== user?.id && (
                        <Button
                          size="small"
                          onClick={() => void handleToggleActive(record)}
                        >
                          {record.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Modal
        title="Invite user"
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateUserInput>
          layout="vertical"
          onFinish={(values) => void handleInvite(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Temporary password"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="Role" initialValue="MEMBER">
            <Select
              options={ASSIGNABLE_ROLES.map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={inviting} block>
            Send invite
          </Button>
        </Form>
      </Modal>
    </Space>
  );
}
