import React, { useState, useEffect } from 'react';
import { Table, Button, message, Space, Input, Card, Tag, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, SettingOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getChannelList } from '../../services/api';
import CreateChannelModal from '../../components/channel/CreateChannelModal';

interface Channel {
  id: number;
  name: string;
  code: string;
  status: string;
  created_at: string;
}

const ChannelList: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await getChannelList();
      setChannels(data);
    } catch (error) {
      message.error('获取渠道列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredChannels = channels.filter(channel => 
    channel.name.toLowerCase().includes(searchText.toLowerCase()) ||
    channel.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      active: { color: 'success', text: '已启用' },
      inactive: { color: 'default', text: '未启用' },
      error: { color: 'error', text: '异常' },
    };
    const config = statusConfig[status] || { color: 'processing', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '渠道名称',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Channel, b: Channel) => a.name.localeCompare(b.name),
    },
    {
      title: '渠道代码',
      dataIndex: 'code',
      key: 'code',
      sorter: (a: Channel, b: Channel) => a.code.localeCompare(b.code),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a: Channel, b: Channel) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Channel) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => navigate(`/channels/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="配置映射">
            <Button 
              type="link" 
              icon={<SettingOutlined />}
              onClick={() => navigate(`/channels/${record.id}/mapping`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }} size="middle">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          新建渠道
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchChannels}
          loading={loading}
        >
          刷新
        </Button>
        <Input
          placeholder="搜索渠道名称或代码"
          prefix={<SearchOutlined />}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredChannels}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
        }}
      />

      <CreateChannelModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchChannels();
          message.success('创建成功');
        }}
      />
    </Card>
  );
};

export default ChannelList;
