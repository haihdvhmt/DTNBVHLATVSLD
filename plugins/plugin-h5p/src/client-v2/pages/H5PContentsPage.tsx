import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Typography, Tag, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useT } from '../locale';

const { Title } = Typography;

export default function H5PContentsPage() {
  const t = useT();
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
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

  useEffect(() => {
    fetchContents();
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await fetch('/api/h5pContents:create', {
      method: 'POST',
      headers,
      body: JSON.stringify(values),
    });
    message.success(t('Created successfully'));
    setCreateModalOpen(false);
    form.resetFields();
    fetchContents();
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: t('Delete Content'),
      content: t('Are you sure you want to delete this content?'),
      onOk: async () => {
        await fetch(`/api/h5pContents:destroy/${id}`, {
          method: 'POST',
          headers,
        });
        message.success(t('Deleted successfully'));
        fetchContents();
      },
    });
  };

  const columns = [
    {
      title: t('Title'),
      dataIndex: 'title',
      key: 'title',
    },
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
          <Button size="small" icon={<EyeOutlined />} title={t('Preview')} disabled />
          <Button size="small" icon={<EditOutlined />} title={t('Edit')} disabled />
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          {t('Add Content')}
        </Button>
      </div>

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
        title={t('Add H5P Content')}
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
