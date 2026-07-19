'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Avatar,
  Layout,
  Menu,
  Typography,
  Space,
  Button,
  Tag,
  Popover,
  Tooltip,
  Divider,
  Badge,
  List,
  Empty,
} from 'antd';
import {
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  ProjectOutlined,
  AuditOutlined,
  ApartmentOutlined,
  BookOutlined,
  BulbOutlined,
  SearchOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing, gradient } from '@epg/design-tokens';
import { glassSiderStyle, gradientTextStyle } from '@/lib/ui-style';
import type { Notification } from '@/lib/types';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const AUDIT_LOG_ROLES = ['ADMIN', 'GOVERNANCE_LEAD', 'AUDITOR'];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, token, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    if (!token) return;
    api
      .listMyNotifications(token)
      .then(setNotifications)
      .catch(() => {
        // Non-critical background fetch — a failure here shouldn't disrupt the shell.
      });
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    if (!token) return;
    try {
      await api.markNotificationRead(token, id);
      loadNotifications();
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await api.markAllNotificationsRead(token);
      loadNotifications();
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
  };

  const navItems = [
    {
      key: '/dashboard',
      icon: <TeamOutlined />,
      label: <Link href="/dashboard">Members</Link>,
    },
    {
      key: '/dashboard/projects',
      icon: <ProjectOutlined />,
      label: <Link href="/dashboard/projects">Projects</Link>,
    },
    {
      key: '/dashboard/departments',
      icon: <ApartmentOutlined />,
      label: <Link href="/dashboard/departments">Departments</Link>,
    },
    {
      key: '/dashboard/sops',
      icon: <BookOutlined />,
      label: <Link href="/dashboard/sops">SOP Library</Link>,
    },
    {
      key: '/dashboard/knowledge',
      icon: <BulbOutlined />,
      label: <Link href="/dashboard/knowledge">Knowledge Base</Link>,
    },
    {
      key: '/dashboard/search',
      icon: <SearchOutlined />,
      label: <Link href="/dashboard/search">Search</Link>,
    },
    ...(user && AUDIT_LOG_ROLES.includes(user.role)
      ? [
          {
            key: '/dashboard/audit',
            icon: <AuditOutlined />,
            label: <Link href="/dashboard/audit">Audit Log</Link>,
          },
        ]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Sider
        collapsible
        trigger={null}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={glassSiderStyle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              padding: spacing[4],
              display: 'flex',
              flexDirection: collapsed ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: spacing[2],
            }}
          >
            <Title level={5} style={{ ...gradientTextStyle, margin: 0 }}>
              {collapsed ? 'EPG' : 'EPG Platform'}
            </Title>
            <Tooltip title={collapsed ? 'Expand menu' : 'Collapse menu'}>
              <Button
                type="text"
                shape="circle"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            </Tooltip>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={navItems}
            style={{ background: 'transparent', border: 'none', flex: 1 }}
          />

          <div style={{ padding: spacing[3] }}>
            <Divider style={{ margin: `${spacing[2]} 0` }} />
            {!collapsed && (
              <Text type="secondary" style={{ paddingLeft: spacing[2] }}>
                Account
              </Text>
            )}
            <Space
              orientation={collapsed ? 'vertical' : 'horizontal'}
              align="center"
              size={parseInt(spacing[2], 10)}
              style={{
                width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                marginTop: spacing[2],
              }}
            >
              {user && (
                <Avatar style={{ background: gradient.accent }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Popover
                trigger="click"
                onOpenChange={(open) => open && loadNotifications()}
                content={
                  <div style={{ width: 280 }}>
                    <Space
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        marginBottom: spacing[2],
                      }}
                    >
                      <Text strong>Notifications</Text>
                      {unreadCount > 0 && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => void handleMarkAllRead()}
                        >
                          Mark all read
                        </Button>
                      )}
                    </Space>
                    {notifications.length === 0 ? (
                      <Empty description="No notifications" />
                    ) : (
                      <List
                        size="small"
                        dataSource={notifications.slice(0, 10)}
                        renderItem={(n) => (
                          <List.Item
                            style={{ cursor: n.isRead ? 'default' : 'pointer' }}
                            onClick={() => !n.isRead && void handleMarkRead(n.id)}
                          >
                            <Space orientation="vertical" size={0} style={{ width: '100%' }}>
                              <Text strong={!n.isRead}>{n.title}</Text>
                              {n.body && <Text type="secondary">{n.body}</Text>}
                            </Space>
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                }
              >
                <Badge count={unreadCount} size="small">
                  <Button type="text" shape="circle" icon={<BellOutlined />} />
                </Badge>
              </Popover>
              <Popover
                trigger="click"
                content={
                  user && (
                    <Space orientation="vertical" size={parseInt(spacing[1], 10)}>
                      <Text strong>{user.name}</Text>
                      <Tag>{user.role}</Tag>
                      {user.role === 'ADMIN' && (
                        <Link href="/dashboard/settings">Organization Settings</Link>
                      )}
                    </Space>
                  )
                }
              >
                <Button type="text" shape="circle" icon={<SettingOutlined />} />
              </Popover>
              <Tooltip title="Sign out">
                <Button
                  type="text"
                  shape="circle"
                  icon={<LogoutOutlined />}
                  onClick={logout}
                />
              </Tooltip>
            </Space>
          </div>
        </div>
      </Sider>
      <Layout style={{ background: 'transparent' }}>
        <Content style={{ padding: spacing[4], background: 'transparent' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <DashboardShell>{children}</DashboardShell>
    </RequireAuth>
  );
}
