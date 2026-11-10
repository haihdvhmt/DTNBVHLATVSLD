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
            <Tag color="blue">{info?.version || '0.2.0'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('H5P Server')}>
            {info?.h5pServerAvailable ? (
              <Tag color="green">{t('Available')}</Tag>
            ) : (
              <Tag color="red">{t('Not Available')}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('Total Contents')}>
            {info?.totalContents ?? 0}
          </Descriptions.Item>
          {info?.installedLibraries !== undefined && (
            <Descriptions.Item label={t('Installed Libraries')}>
              {info.installedLibraries}
            </Descriptions.Item>
          )}
          {info?.storagePath && (
            <Descriptions.Item label={t('Storage Path')}>
              <code>{info.storagePath}</code>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {!info?.h5pServerAvailable && (
        <Alert
          type="warning"
          showIcon
          message={t('H5P Server Not Initialized')}
          description={t('The @lumieducation/h5p-server package is required for interactive content editing. Content records can still be managed through the Content Manager.')}
        />
      )}

      <Card title={t('How to Use')}>
        <Alert
          type="info"
          showIcon
          message={t('Getting Started')}
          description={t('1. Install H5P content type libraries (.h5p files) through the Hub or manual upload. 2. Use the Content Manager tab to create and manage interactive content. 3. Embed content in your training materials using the H5P block.')}
        />
      </Card>
    </Space>
  );
}
