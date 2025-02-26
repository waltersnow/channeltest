import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import AppHeader from './components/layout/AppHeader';
import AppSider from './components/layout/AppSider';
import ChannelList from './pages/channel/ChannelList';
import ChannelDetail from './pages/channel/ChannelDetail';
import ChannelMapping from './pages/channel/ChannelMapping';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <AppSider />
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
            <Routes>
              <Route path="/" element={<ChannelList />} />
              <Route path="/channels" element={<ChannelList />} />
              <Route path="/channels/:id" element={<ChannelDetail />} />
              <Route path="/channels/:id/mapping" element={<ChannelMapping />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
