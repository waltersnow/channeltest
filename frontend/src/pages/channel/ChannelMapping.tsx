import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Upload, Button, message, Row, Col, Spin, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { getChannelDetail, uploadApiDoc, getFieldMappings, updateFieldMappings, deleteFieldMappings } from '../../services/api';
import FieldMappingTable from '../../components/mapping/FieldMappingTable';
import MappingPreview from '../../components/mapping/MappingPreview';

interface ChannelField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

const ChannelMapping: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [channelFields, setChannelFields] = useState<ChannelField[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchInitialData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setPageLoading(true);
      const [channelData, mappingsData] = await Promise.all([
        getChannelDetail(Number(id)),
        getFieldMappings(Number(id))
      ]);
      
      setChannel(channelData);
      if (channelData.config?.parsed_fields) {
        setChannelFields(channelData.config.parsed_fields);
      }
      setMappings(mappingsData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      message.error('加载数据失败');
    } finally {
      setPageLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      const result = await uploadApiDoc(Number(id), file);
      setChannelFields(result.fields || []);
      message.success('接口文档解析成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '接口文档解析失败');
    } finally {
      setLoading(false);
    }
    return false; // 阻止自动上传
  };

  const handleMappingChange = (newMappings: any[]) => {
    setMappings(newMappings);
  };

  const handleMappingSave = async (newMappings: any[]) => {
    try {
      setLoading(true);
      // 移除没有字段选择的空映射
      const validMappings = newMappings.filter(
        mapping => mapping.channel_field && mapping.internal_field
      );
      console.log('Saving mappings:', validMappings);
      const savedMappings = await updateFieldMappings(Number(id), validMappings);
      console.log('Server response:', savedMappings);
      // 使用服务器返回的转换后的数据更新状态
      setMappings(savedMappings);
      message.success('保存成功');
    } catch (error: any) {
      console.error('Save mapping error:', error);
      // 检查错误响应的结构
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.detail ||
                         error.message ||
                         '保存映射失败';
      console.error('Error details:', {
        response: error.response?.data,
        message: error.message,
        stack: error.stack
      });
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllMappings = async () => {
    try {
      setLoading(true);
      await deleteFieldMappings(Number(id));
      setMappings([]);
      message.success('所有映射已删除');
    } catch (error: any) {
      console.error('Delete mappings error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.detail ||
                         error.message ||
                         '删除映射失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card title="渠道信息" style={{ marginBottom: 24 }}>
        <p>渠道名称：{channel?.name || '-'}</p>
        <p>渠道代码：{channel?.code || '-'}</p>
        <Upload
          beforeUpload={handleFileUpload}
          showUploadList={false}
        >
          <Button 
            icon={<UploadOutlined />} 
            loading={loading}
          >
            上传接口文档
          </Button>
        </Upload>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card 
            title="字段映射配置" 
            extra={
              <Popconfirm
                title="确定要删除所有映射吗？"
                onConfirm={handleDeleteAllMappings}
                okText="确定"
                cancelText="取消"
              >
                <Button 
                  type="link" 
                  danger 
                  icon={<DeleteOutlined />}
                  loading={loading}
                >
                  删除所有映射
                </Button>
              </Popconfirm>
            }
          >
            <FieldMappingTable
              channelId={Number(id)}
              channelFields={channelFields}
              mappings={mappings}
              onChange={handleMappingChange}
              onSave={handleMappingSave}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card title="映射预览">
            <MappingPreview 
              channelId={Number(id)}
              channelFields={channelFields}
              mappings={mappings} 
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChannelMapping;
