'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import { spacing, containerWidth } from '@epg/design-tokens';
import { glassPanelStrongStyle, gradientTextStyle } from '@/lib/ui-style';
import type { LoginInput } from '@/lib/types';

const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginInput) => {
    setError(null);
    setSubmitting(true);
    try {
      await login(values);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: spacing[6],
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: containerWidth.sm, ...glassPanelStrongStyle }}
      >
        <Title level={3} style={gradientTextStyle}>
          Sign in
        </Title>
        {error && (
          <Alert
            type="error"
            title={error}
            showIcon
            style={{ marginBottom: spacing[4] }}
          />
        )}
        <Form<LoginInput> layout="vertical" onFinish={(values) => void onFinish(values)}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 8 }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Sign in
          </Button>
        </Form>
        <Paragraph style={{ marginTop: spacing[4] }}>
          Setting up a new organization? <Link href="/register">Register</Link>
        </Paragraph>
      </Card>
    </div>
  );
}
