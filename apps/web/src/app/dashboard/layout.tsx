'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layout, Menu, Typography, Space, Button, Tag } from 'antd';
import { RequireAuth } from '@/components/require-auth';
import { useAuth } from '@/lib/auth-context';
import { spacing, semanticColor } from '@epg/design-tokens';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const NAV_ITEMS = [
  { key: '/dashboard', label: <Link href="/dashboard">Members</Link> },
  { key: '/dashboard/projects', label: <Link href="/dashboard/projects">Projects</Link> },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space size={parseInt(spacing[8], 10)} align="center">
          <Title level={4} style={{ color: semanticColor.textOnPrimary, margin: 0 }}>
            EPG Platform
          </Title>
          <Menu
            mode="horizontal"
            theme="dark"
            selectedKeys={[pathname]}
            items={NAV_ITEMS}
            style={{ minWidth: 300, borderBottom: 'none' }}
          />
        </Space>
        <Space size={parseInt(spacing[4], 10)}>
          {user && (
            <Text style={{ color: semanticColor.textOnPrimary }}>
              {user.name} <Tag>{user.role}</Tag>
            </Text>
          )}
          <Button onClick={logout}>Sign out</Button>
        </Space>
      </Header>
      <Content style={{ padding: spacing[8] }}>{children}</Content>
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
