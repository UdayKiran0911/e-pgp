'use client';

import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Modal, Select, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';
import { spacing } from '@epg/design-tokens';
import { glassPanelStyle } from '@/lib/ui-style';
import type { CreateDepartmentInput, Department } from '@/lib/types';

function buildTree(departments: Department[], parentId: string | null): DataNode[] {
  return departments
    .filter((department) => department.parentId === parentId)
    .map((department) => ({
      key: department.id,
      title: department.name,
      children: buildTree(departments, department.id),
    }));
}

async function fetchDepartments(token: string) {
  return api.listDepartments(token);
}

export default function DepartmentsPage() {
  const { user, token } = useAuth();
  const { message } = App.useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchDepartments(token)
      .then((data) => {
        if (cancelled) return;
        setDepartments(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load departments.');
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
    setDepartments(await fetchDepartments(token));
  };

  const handleCreate = async (values: CreateDepartmentInput) => {
    if (!token) return;
    setCreating(true);
    try {
      await api.createDepartment(token, values);
      void message.success('Department created.');
      setCreateOpen(false);
      await reload();
    } catch (err) {
      void message.error(
        err instanceof ApiError ? err.message : 'Failed to create the department.',
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
        title="Departments"
        loading={loading}
        extra={
          isAdmin && (
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              Add department
            </Button>
          )
        }
      >
        {departments.length > 0 ? (
          <Tree treeData={buildTree(departments, null)} defaultExpandAll />
        ) : (
          !loading && 'No departments yet.'
        )}
      </Card>

      <Modal
        title="Add a department"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form<CreateDepartmentInput>
          layout="vertical"
          onFinish={(values) => void handleCreate(values)}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, min: 2 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="Parent department">
            <Select
              allowClear
              placeholder="None (top-level)"
              options={departments.map((department) => ({
                value: department.id,
                label: department.name,
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={creating} block>
            Add department
          </Button>
        </Form>
      </Modal>
    </>
  );
}
