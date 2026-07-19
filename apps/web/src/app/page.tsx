"use client";

import Link from "next/link";
import { Layout, Typography, Card, Space, Button } from "antd";
import { spacing } from "@epg/design-tokens";
import { useAuth } from "@/lib/auth-context";
import { glassHeaderStyle, glassPanelStyle, gradientTextStyle } from "@/lib/ui-style";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <Layout style={{ minHeight: "100vh", background: "transparent" }}>
      <Header style={{ ...glassHeaderStyle, display: "flex", alignItems: "center" }}>
        <Title level={4} style={{ ...gradientTextStyle, margin: 0 }}>
          EPG Platform
        </Title>
      </Header>
      <Content style={{ padding: spacing[8], background: "transparent" }}>
        <Space orientation="vertical" size={parseInt(spacing[6], 10)} style={{ width: "100%" }}>
          <Card style={glassPanelStyle}>
            <Title level={3}>Standardize. Govern. Audit. Deliver.</Title>
            <Paragraph>
              The Enterprise Project Governance Platform is scaffolded and
              ready. See <Text code>roadmap.md</Text> for the phase-by-phase
              build plan.
            </Paragraph>
            {!loading && (
              <Space>
                {user ? (
                  <Link href="/dashboard">
                    <Button type="primary">Go to dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button type="primary">Sign in</Button>
                    </Link>
                    <Link href="/register">
                      <Button>Register an organization</Button>
                    </Link>
                  </>
                )}
              </Space>
            )}
          </Card>
        </Space>
      </Content>
    </Layout>
  );
}
