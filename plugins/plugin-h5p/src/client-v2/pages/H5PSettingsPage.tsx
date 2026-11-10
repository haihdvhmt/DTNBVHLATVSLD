import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Spin, Alert, Typography, Space, Tag } from 'antd';
import { useT } from '../locale';

const { Title } = Typography;

export default function H5PSettingsPage() {
  const t = useT();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/h5p:info', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('NOCOBASE_TOKEN') || ''}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setInfo(data?.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (error) return <Alert type="error" message={t('Error')} description={error} />;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: 24 }}>
      <Title level={4}>{t('H5P Interactive Content')}</Title>

      <Card title={t('System Info')}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label={t('Plugin Version')}>
            <Tag color="blue">{info?.version || '0.1.0'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('Total Contents')}>
            {info?.totalContents ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label={t('Storage Path')}>
            <code>{info?.storagePath || 'N/A'}</code>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('Setup Guide')}>
        <Alert
          type="info"
          showIcon
          message={t('H5P Libraries Required')}
          description={t(
            'To create interactive content, you need to install H5P content type libraries. Upload .h5p library files through the Content Manager tab.',
          )}
        />
      </Card>
    </Space>
  );
}
