import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Typography, Tag, Modal, Form, Input, message, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useT } from '../locale';

const { Title } = Typography;

export default function H5PContentsPage() {
  const t = useT();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [h5pAvailable, setH5pAvailable] = useState(false);
  const [form] = Form.useForm();

  const token = localStorage.getItem('NOCOBASE_TOKEN') || '';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchContents = () => {
    setLoading(true);
    fetch('/api/h5pContents:list?appends=createdBy&sort=-createdAt', { headers })
      .then((res) => res.json())
      .then((data) => {
        setContents(data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const checkH5PStatus = () => {
    fetch('/api/h5p:info', { headers })
      .then((res) => res.json())
      .then((data) => {
        setH5pAvailable(data?.data?.h5pServerAvailable || false);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchContents();
    checkH5PStatus();
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      const res = await fetch('/api/h5pContents:create', {
        method: 'POST',
        headers,
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.errors?.[0]?.message || `Error ${res.status}`;
        message.error(msg);
        return;
      }
      message.success(t('Created successfully'));
      setCreateModalOpen(false);
      form.resetFields();
      fetchContents();
    } catch {
      message.error(t('Network error'));
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: t('Delete Content'),
      content: t('Are you sure you want to delete this content?'),
      onOk: async () => {
        await fetch(`/api/h5pContents:destroy/${id}`, { method: 'POST', headers });
        message.success(t('Deleted successfully'));
        fetchContents();
      },
    });
  };

  const openPlayer = (contentId: number) => {
    const url = `/api/h5p-embed?mode=player&contentId=${contentId}&token=${encodeURIComponent(token)}`;
    window.open(url, '_blank', 'width=960,height=700');
  };

  const openEditor = (contentId?: number) => {
    let url = `/api/h5p-embed?mode=editor&token=${encodeURIComponent(token)}`;
    if (contentId) url += `&contentId=${contentId}`;
    window.open(url, '_blank', 'width=1100,height=800');
  };

  const columns = [
    { title: t('Title'), dataIndex: 'title', key: 'title' },
    {
      title: t('Content Type'),
      dataIndex: 'contentType',
      key: 'contentType',
      render: (v: string) => v ? <Tag>{v}</Tag> : '-',
    },
    {
      title: t('Library'),
      dataIndex: 'library',
      key: 'library',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const color = v === 'published' ? 'green' : v === 'draft' ? 'orange' : 'default';
        return <Tag color={color}>{t(v || 'draft')}</Tag>;
      },
    },
    {
      title: t('Created At'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: t('Actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            title={t('Preview')}
            onClick={() => openPlayer(record.id)}
            disabled={!record.library}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            title={t('Edit')}
            onClick={() => openEditor(record.id)}
            disabled={!h5pAvailable}
          />
          <Button
            size="small"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>{t('H5P Content Manager')}</Title>
        <Space>
          {h5pAvailable && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
              {t('Create with H5P Editor')}
            </Button>
          )}
          <Button icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            {t('Add Content Record')}
          </Button>
        </Space>
      </div>

      {!h5pAvailable && (
        <Alert
          type="warning"
          showIcon
          message={t('H5P Server Not Available')}
          description={t('The H5P editor requires @lumieducation/h5p-server. Content records can be managed but interactive editing is not available.')}
        />
      )}

      <Card>
        <Table
          dataSource={contents}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={t('Add H5P Content Record')}
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        okText={t('Create')}
        cancelText={t('Cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={t('Title')}
            rules={[{ required: true, message: t('Please enter a title') }]}
          >
            <Input placeholder={t('Enter content title')} />
          </Form.Item>
          <Form.Item name="contentType" label={t('Content Type')}>
            <Input placeholder={t('e.g. Quiz, Interactive Video, Course Presentation')} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
