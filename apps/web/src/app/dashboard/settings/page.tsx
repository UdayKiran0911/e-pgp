'use client';

import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { Organization, UpdateOrganizationInput } from '@/lib/types';

const { Text } = Typography;

export default function OrganizationSettingsPage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form] = Form.useForm<UpdateOrganizationInput>();

  const canManage = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getMyOrganization(token)
      .then((data) => {
        if (cancelled) return;
        setOrganization(data);
        form.setFieldsValue({ name: data.name });
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : 'Failed to load organization.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, form]);

  const handleSave = async (values: UpdateOrganizationInput) => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await api.updateOrganization(token, values);
      setOrganization(updated);
      void message.success('Organization updated.');
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to update organization.',
      );
    } finally {
      setSaving(false);
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

      <Card style={glassPanelStyle} title="Organization Settings" loading={loading}>
        {organization && (
          <Form<UpdateOrganizationInput>
            form={form}
            layout="vertical"
            onFinish={(values) => void handleSave(values)}
            style={{ maxWidth: 420 }}
          >
            <Form.Item
              name="name"
              label="Organization name"
              rules={[{ required: true, min: 2 }]}
            >
              <Input disabled={!canManage} />
            </Form.Item>
            {canManage ? (
              <Button type="primary" htmlType="submit" loading={saving}>
                Save changes
              </Button>
            ) : (
              <Text type="secondary">
                Only an ADMIN can rename the organization.
              </Text>
            )}
          </Form>
        )}
      </Card>
    </>
  );
}
