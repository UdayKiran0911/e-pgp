'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';
import { spacing, containerWidth } from '@epg/design-tokens';
import type { RegisterInput } from '@/lib/types';

const { Title, Paragraph } = Typography;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: RegisterInput) => {
    setError(null);
    setSubmitting(true);
    try {
      await register(values);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to register.');
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
      <Card style={{ width: '100%', maxWidth: containerWidth.sm }}>
        <Title level={3}>Create your organization</Title>
        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            style={{ marginBottom: spacing[4] }}
          />
        )}
        <Form<RegisterInput>
          layout="vertical"
          onFinish={(values) => void onFinish(values)}
        >
          <Form.Item
            name="organizationName"
            label="Organization name"
            rules={[{ required: true, min: 2 }]}
          >
            <Input autoComplete="organization" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Your name"
            rules={[{ required: true, min: 2 }]}
          >
            <Input autoComplete="name" />
          </Form.Item>
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
            extra="At least 8 characters."
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Create organization
          </Button>
        </Form>
        <Paragraph style={{ marginTop: spacing[4] }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </Paragraph>
      </Card>
    </div>
  );
}
