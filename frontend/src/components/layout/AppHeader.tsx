import React from 'react';
import { Layout, Typography } from 'antd';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  return (
    <Header style={{ background: '#fff', padding: '0 24px' }}>
      <Title level={4} style={{ margin: '16px 0' }}>支付渠道管理系统</Title>
    </Header>
  );
};

export default AppHeader;
