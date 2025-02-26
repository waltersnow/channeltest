import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Space } from 'antd';

const ChannelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="渠道详情">
        <Descriptions>
          <Descriptions.Item label="渠道ID">{id}</Descriptions.Item>
          {/* 这里可以添加更多渠道详情信息 */}
        </Descriptions>
      </Card>
    </Space>
  );
};

export default ChannelDetail;
