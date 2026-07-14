"use client";

import { Layout, Typography, Card, Space } from "antd";
import { spacing, semanticColor } from "@epg/design-tokens";

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function Home() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <Title level={4} style={{ color: semanticColor.textOnPrimary, margin: 0 }}>
          EPG Platform
        </Title>
      </Header>
      <Content style={{ padding: spacing[8] }}>
        <Space orientation="vertical" size={parseInt(spacing[6], 10)} style={{ width: "100%" }}>
          <Card>
            <Title level={3}>Standardize. Govern. Audit. Deliver.</Title>
            <Paragraph>
              The Enterprise Project Governance Platform is scaffolded and
              ready. See <Text code>roadmap.md</Text> for the phase-by-phase
              build plan.
            </Paragraph>
          </Card>
        </Space>
      </Content>
    </Layout>
  );
}
